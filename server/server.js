// Importar dependencias
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access_secret";
const MFA_CODE_TTL = 5 * 60 * 1000;
const PASSWORD_RESET_TOKEN_TTL = 15 * 60 * 1000; // 15 minutos

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: ['http://localhost:5173', 'https://desarrollo-web-proyecto-xi.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));


// Crear directorio de imágenes si no existe
const imagesDir = path.join(__dirname, "public/images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Configurar multer para subir imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const db = mysql.createConnection(
  process.env.DATABASE_URL || {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "storefigures",
    ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : undefined,
  },
);

function initDatabase() {
  db.query(
    `CREATE TABLE IF NOT EXISTS user_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      user_agent VARCHAR(255),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_activity DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      active TINYINT(1) NOT NULL DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    (err) => {
      if (err) {
        console.error("Error creando tabla user_sessions:", err);
      }
    },
  );

  // Crear tabla para tokens de recuperación de contraseña
  db.query(
    `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_token (token),
      INDEX idx_expires_at (expires_at)
    )`,
    (err) => {
      if (err) {
        console.error("Error creando tabla password_reset_tokens:", err);
      }
    },
  );

  const columns = [
    { name: "theme", definition: "VARCHAR(20) NOT NULL DEFAULT 'light'" },
    { name: "language", definition: "VARCHAR(10) NOT NULL DEFAULT 'es'" },
    { name: "mfa_enabled", definition: "TINYINT(1) NOT NULL DEFAULT 0" },
    { name: "mfa_code", definition: "VARCHAR(10) NULL" },
    { name: "mfa_expires", definition: "BIGINT NULL" },
  ];

  columns.forEach((column) => {
    db.query(
      "SHOW COLUMNS FROM users LIKE ?",
      [column.name],
      (err, results) => {
        if (err) {
          console.error(`Error comprobando columna ${column.name}:`, err);
          return;
        }

        if (results.length === 0) {
          db.query(
            `ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`,
            (alterErr) => {
              if (alterErr) {
                console.error(
                  `Error agregando columna ${column.name}:`,
                  alterErr,
                );
              }
            },
          );
        }
      },
    );
  });
}

db.connect((err) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err);
    process.exit(1);
  }
  console.log("Conexión a la base de datos establecida correctamente");
  initDatabase();
});

function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
}

function createSession(userId, userAgent, callback) {
  db.query(
    "INSERT INTO user_sessions (user_id, user_agent) VALUES (?, ?)",
    [userId, userAgent],
    (err, result) => {
      if (err) return callback(err);
      callback(null, result.insertId);
    },
  );
}

function queryActiveSession(sessionId, callback) {
  db.query(
    "SELECT * FROM user_sessions WHERE id = ? AND active = 1",
    [sessionId],
    callback,
  );
}

function deactivateSession(sessionId, callback) {
  db.query(
    "UPDATE user_sessions SET active = 0 WHERE id = ?",
    [sessionId],
    callback,
  );
}

function fetchUserSessions(userId, callback) {
  db.query(
    "SELECT id, user_agent, created_at, last_activity FROM user_sessions WHERE user_id = ? AND active = 1 ORDER BY created_at DESC",
    [userId],
    callback,
  );
}

function createPasswordResetToken(userId, callback) {
  const token = require("crypto").randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL);

  db.query(
    "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
    [userId, token, expiresAt],
    (err, result) => {
      if (err) return callback(err);
      callback(null, token);
    },
  );
}

function validatePasswordResetToken(token, callback) {
  db.query(
    "SELECT user_id FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used = 0",
    [token],
    callback,
  );
}

function invalidatePasswordResetToken(token, callback) {
  db.query(
    "UPDATE password_reset_tokens SET used = 1 WHERE token = ?",
    [token],
    callback,
  );
}

function fetchUserById(userId, callback) {
  db.query(
    "SELECT id, username, email, role, theme, language, mfa_enabled FROM users WHERE id = ?",
    [userId],
    callback,
  );
}

// Middleware para verificar el token de autenticación
function authenticateToken(req, res, next) {
  const token = req.cookies.accessToken;
  if (!token) {
    console.error("Falta la cookie de sesión accessToken.");
    return res
      .status(401)
      .json({ message: "No autorizado. Falta la cookie de sesión." });
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, payload) => {
    if (err) {
      console.error("Error verificando el token:", err);
      return res.status(403).json({ message: "Sesión inválida o expirada." });
    }

    if (!payload.sessionId) {
      console.error("El token no contiene un sessionId válido.");
      return res.status(403).json({ message: "Sesión inválida." });
    }

    queryActiveSession(payload.sessionId, (sessionErr, sessionResults) => {
      if (sessionErr) {
        console.error("Error consultando la sesión activa:", sessionErr);
        return res.status(500).json({ message: "Error interno del servidor." });
      }

      if (sessionResults.length === 0) {
        console.warn(
          "Sesión cerrada o no encontrada para sessionId:",
          payload.sessionId,
        );
        return res.status(403).json({ message: "Sesión cerrada remotamente." });
      }

      req.user = payload;
      req.sessionId = payload.sessionId;

      // Actualizar la última actividad de la sesión
      db.query(
        "UPDATE user_sessions SET last_activity = NOW() WHERE id = ?",
        [payload.sessionId],
        (updateErr) => {
          if (updateErr) {
            console.error(
              "Error actualizando la última actividad de la sesión:",
              updateErr,
            );
          }
        },
      );

      next();
    });
  });
}

function authenticateAdmin(req, res, next) {
  const token = req.cookies.accessToken;
  if (!token)
    return res.status(401).json({ message: "No autorizado. Falta el token." });

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, payload) => {
    if (err || payload.role !== "admin")
      return res.status(403).json({ message: "No autorizado." });

    req.user = payload;
    next();
  });
}

function authenticateEditorOrAdmin(req, res, next) {
  const token = req.cookies.accessToken;
  if (!token)
    return res.status(401).json({ message: "No autorizado. Falta el token." });

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, payload) => {
    if (err || (payload.role !== "admin" && payload.role !== "editor"))
      return res.status(403).json({
        message: "No autorizado. Se requiere rol de editor o administrador.",
      });

    req.user = payload;
    next();
  });
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "saul11chido@gmail.com",
    pass: process.env.EMAIL_PASS || "lrhtiecsfgukcxcv",
  },
});

app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios." });

  const query =
    "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')";
  db.query(query, [username, email, password], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY")
        return res
          .status(400)
          .json({ message: "El usuario o correo ya existe." });
      return res.status(500).json({ message: "Error al registrar usuario." });
    }
    res.status(201).json({ message: "Usuario registrado exitosamente." });
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const query =
    "SELECT id, username, email, role, mfa_enabled FROM users WHERE email = ? AND password = ?";

  db.query(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ message: "Error en el servidor." });
    if (results.length === 0)
      return res.status(401).json({ message: "Credenciales inválidas." });

    const user = results[0];

    if (user.mfa_enabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + MFA_CODE_TTL;

      db.query(
        "UPDATE users SET mfa_code = ?, mfa_expires = ? WHERE id = ?",
        [otp, expires, user.id],
        async (updateErr) => {
          if (updateErr)
            return res
              .status(500)
              .json({ message: "Error al generar el código MFA." });

          try {
            await transporter.sendMail({
              from: `"Tienda Figuras" <${process.env.EMAIL_USER || "saul11chido@gmail.com"}>`,
              to: user.email,
              subject: "🔐 Código de verificación MFA",
              text: `Hola ${user.username},\n\nTu código de verificación es: ${otp}\n\nNo compartas este código con nadie.`,
            });

            res.json({
              message: "Código enviado al correo.",
              requireMfa: true,
              email: user.email,
            });
          } catch (mailErr) {
            console.error("Error enviando correo:", mailErr);
            res
              .status(500)
              .json({ message: "Error al enviar el correo de verificación." });
          }
        },
      );
    } else {
      createSession(
        user.id,
        req.headers["user-agent"] || "desconocido",
        (sessionErr, sessionId) => {
          if (sessionErr)
            return res
              .status(500)
              .json({ message: "Error al iniciar sesión." });

          const accessToken = generateAccessToken({
            id: user.id,
            username: user.username,
            role: user.role,
            sessionId,
          });

          res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Solo seguro en producción
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Ajuste para local y producción
            maxAge: 24 * 60 * 60 * 1000,
          });

          res.json({ message: "Login exitoso", user });
        },
      );
    }
  });
});

app.post("/api/verify-mfa", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res
      .status(400)
      .json({ message: "Correo electrónico y código son obligatorios." });

  db.query(
    "SELECT id, username, email, role, mfa_code, mfa_expires FROM users WHERE email = ?",
    [email],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(400).json({ message: "Usuario no encontrado." });

      const user = results[0];
      if (user.mfa_code !== otp)
        return res.status(401).json({ message: "Código incorrecto." });
      if (Date.now() > user.mfa_expires)
        return res.status(401).json({ message: "El código ha expirado." });

      db.query(
        "UPDATE users SET mfa_code = NULL, mfa_expires = NULL WHERE id = ?",
        [user.id],
        (clearErr) => {
          if (clearErr) console.error("Error borrando MFA:", clearErr);

          createSession(
            user.id,
            req.headers["user-agent"] || "desconocido",
            (sessionErr, sessionId) => {
              if (sessionErr)
                return res
                  .status(500)
                  .json({ message: "Error al iniciar sesión." });

              const accessToken = generateAccessToken({
                id: user.id,
                username: user.username,
                role: user.role,
                sessionId,
              });

              res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", // Solo seguro en producción
                sameSite:
                  process.env.NODE_ENV === "production" ? "none" : "lax", // Ajuste para local y producción
                maxAge: 24 * 60 * 60 * 1000,
              });

              res.json({ message: "Login completado con éxito", user });
            },
          );
        },
      );
    },
  );
});

app.post("/api/logout", authenticateToken, (req, res) => {
  deactivateSession(req.sessionId, (err) => {
    if (err) console.error("Error desactivando sesión:", err);
    res.clearCookie("accessToken");
    res.json({ message: "Sesión cerrada." });
  });
});

// Endpoint para solicitar recuperación de contraseña
app.post("/api/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ message: "El email es obligatorio." });

  db.query(
    "SELECT id, username FROM users WHERE email = ?",
    [email],
    (err, results) => {
      if (err)
        return res.status(500).json({ message: "Error en el servidor." });
      if (results.length === 0)
        return res
          .status(404)
          .json({ message: "No se encontró una cuenta con ese email." });

      const user = results[0];

      createPasswordResetToken(user.id, async (tokenErr, token) => {
        if (tokenErr)
          return res
            .status(500)
            .json({ message: "Error generando token de recuperación." });

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;
        try {
          await transporter.sendMail({
            from: `"Tienda Figuras" <${process.env.EMAIL_USER || "saul11chido@gmail.com"}>`,
            to: email,
            subject: "🔑 Recuperación de Contraseña - Tienda Figuras",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0d6efd;">Recuperación de Contraseña</h2>
              <p>Hola ${user.username},</p>
              <p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Restablecer Contraseña</a>
              </p>
              <p><strong>Importante:</strong></p>
              <ul>
                <li>Este enlace expirará en 15 minutos</li>
                <li>Si no solicitaste este cambio, ignora este email</li>
                <li>El enlace solo puede usarse una vez</li>
              </ul>
              <p>Si el botón no funciona, copia y pega esta URL en tu navegador:</p>
              <p style="word-break: break-all; color: #666;">${resetLink}</p>
              <hr style="margin: 30px 0;">
              <p style="color: #666; font-size: 12px;">Tienda Figuras - Sistema de recuperación de contraseña</p>
            </div>
          `,
          });

          res.json({
            message: "Se ha enviado un enlace de recuperación a tu email.",
          });
        } catch (mailErr) {
          console.error("Error enviando email de recuperación:", mailErr);
          res
            .status(500)
            .json({ message: "Error enviando el email de recuperación." });
        }
      });
    },
  );
});

// Endpoint para resetear contraseña con token
app.post("/api/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword)
    return res
      .status(400)
      .json({ message: "Token y nueva contraseña son obligatorios." });

  validatePasswordResetToken(token, (err, results) => {
    if (err) return res.status(500).json({ message: "Error validando token." });
    if (results.length === 0)
      return res.status(400).json({ message: "Token inválido o expirado." });

    const userId = results[0].user_id;

    // Actualizar contraseña
    db.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [newPassword, userId],
      (updateErr) => {
        if (updateErr)
          return res
            .status(500)
            .json({ message: "Error actualizando contraseña." });

        // Invalidar token
        invalidatePasswordResetToken(token, (invalidateErr) => {
          if (invalidateErr)
            console.error("Error invalidando token:", invalidateErr);

          res.json({ message: "Contraseña actualizada correctamente." });
        });
      },
    );
  });
});

app.get("/api/me", authenticateToken, (req, res) => {
  fetchUserById(req.user.id, (err, results) => {
    if (err || results.length === 0)
      return res.status(500).json({ message: "Error obteniendo usuario." });
    res.json({ user: results[0] });
  });
});

app.get("/api/user-settings", authenticateToken, (req, res) => {
  fetchUserById(req.user.id, (err, results) => {
    if (err || results.length === 0)
      return res
        .status(500)
        .json({ message: "Error obteniendo configuración." });

    fetchUserSessions(req.user.id, (sessionErr, sessions) => {
      if (sessionErr)
        return res.status(500).json({ message: "Error obteniendo sesiones." });

      res.json({ user: results[0], sessions, currentSessionId: req.sessionId });
    });
  });
});

app.patch("/api/user-settings", authenticateToken, (req, res) => {
  const { theme, language } = req.body;
  const themeValue = theme === "dark" ? "dark" : "light";
  const languageValue = typeof language === "string" ? language : "es";

  db.query(
    "UPDATE users SET theme = ?, language = ? WHERE id = ?",
    [themeValue, languageValue, req.user.id],
    (err) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error guardando preferencias." });

      fetchUserById(req.user.id, (fetchErr, results) => {
        if (fetchErr || results.length === 0)
          return res
            .status(500)
            .json({ message: "Error obteniendo usuario actualizado." });
        res.json({ message: "Preferencias actualizadas.", user: results[0] });
      });
    },
  );
});

app.patch("/api/user-settings/password", authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res
      .status(400)
      .json({ message: "Los campos de contraseña son obligatorios." });

  db.query(
    "SELECT password FROM users WHERE id = ?",
    [req.user.id],
    (err, results) => {
      if (err || results.length === 0)
        return res
          .status(500)
          .json({ message: "Error verificando la contraseña." });

      if (results[0].password !== currentPassword)
        return res
          .status(401)
          .json({ message: "Contraseña actual incorrecta." });

      db.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [newPassword, req.user.id],
        (updateErr) => {
          if (updateErr)
            return res
              .status(500)
              .json({ message: "Error actualizando la contraseña." });
          res.json({ message: "Contraseña actualizada correctamente." });
        },
      );
    },
  );
});

app.patch("/api/user-settings/mfa", authenticateToken, (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean")
    return res
      .status(400)
      .json({ message: "El valor enabled debe ser booleano." });

  db.query(
    "UPDATE users SET mfa_enabled = ? WHERE id = ?",
    [enabled ? 1 : 0, req.user.id],
    (err) => {
      if (err)
        return res.status(500).json({ message: "Error actualizando MFA." });

      fetchUserById(req.user.id, (fetchErr, results) => {
        if (fetchErr || results.length === 0)
          return res
            .status(500)
            .json({ message: "Error obteniendo usuario actualizado." });
        res.json({
          message: "Configuración MFA actualizada.",
          user: results[0],
        });
      });
    },
  );
});

app.post(
  "/api/user-sessions/:sessionId/revoke",
  authenticateToken,
  (req, res) => {
    const sessionId = Number(req.params.sessionId);
    if (!sessionId)
      return res.status(400).json({ message: "Sesión inválida." });

    db.query(
      "SELECT user_id FROM user_sessions WHERE id = ?",
      [sessionId],
      (err, results) => {
        if (err || results.length === 0)
          return res.status(404).json({ message: "Sesión no encontrada." });
        if (results[0].user_id !== req.user.id)
          return res
            .status(403)
            .json({ message: "No puedes cerrar esa sesión." });

        deactivateSession(sessionId, (deactivateErr) => {
          if (deactivateErr)
            return res
              .status(500)
              .json({ message: "Error cerrando la sesión." });
          res.json({ message: "Sesión cerrada correctamente." });
        });
      },
    );
  },
);

app.get("/api/products", (req, res) => {
  const query = "SELECT * FROM figures";
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

  db.query(query, (err, results) => {
    if (err)
      return res.status(500).json({ message: "Error al obtener productos" });
    const updatedResults = results.map((product) => ({
      ...product,
      imagen: `${backendUrl}/api/imagenes/${product.imagenes}`,
    }));
    res.json(updatedResults);
  });
});

// Crear producto (requiere editor o admin)
app.post(
  "/api/products",
  authenticateEditorOrAdmin,
  upload.single("imagen"),
  (req, res) => {
    const { nombre, categoria, precio, descripcion } = req.body;

    if (!nombre || !categoria || !precio || !descripcion) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Es necesario enviar una imagen" });
    }

    const imagenFilename = req.file.filename;
    const query =
      "INSERT INTO figures (nombre, categoria, precio, descripcion, imagenes) VALUES (?, ?, ?, ?, ?)";
    db.query(
      query,
      [nombre, categoria, precio, descripcion, imagenFilename],
      (err, result) => {
        if (err) {
          console.error("Error al crear producto:", err);
          return res.status(500).json({
            message: "Error al crear producto",
            error: err.message,
          });
        }
        res.status(201).json({
          message: "Producto creado exitosamente",
          id: result.insertId,
        });
      },
    );
  },
);

// Actualizar producto (requiere admin para editar cualquier producto, editor solo puede editar productos creados por él si implementamos owner tracking)
app.put("/api/products/:id", authenticateEditorOrAdmin, (req, res) => {
  const { nombre, categoria, precio, descripcion, imagenes, status } = req.body;
  const productId = req.params.id;

  if (!nombre || !categoria || !precio || !descripcion) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios" });
  }

  // Si es editor, verificar que tenga permisos para editar (por ahora permitimos a todos los editores/admin)
  const query =
    "UPDATE figures SET nombre = ?, categoria = ?, precio = ?, descripcion = ?, imagenes = ?, status = ? WHERE id = ?";
  db.query(
    query,
    [
      nombre,
      categoria,
      precio,
      descripcion,
      imagenes || "",
      status || "available",
      productId,
    ],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error al actualizar producto" });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Producto no encontrado" });
      res.json({ message: "Producto actualizado exitosamente" });
    },
  );
});

// Eliminar producto (solo admin)
app.delete("/api/products/:id", authenticateAdmin, (req, res) => {
  const productId = req.params.id;

  const query = "DELETE FROM figures WHERE id = ?";
  db.query(query, [productId], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Error al eliminar producto" });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto eliminado exitosamente" });
  });
});

app.get("/api/cart", authenticateToken, (req, res) => {
  const query = `
    SELECT c.quantity, f.* FROM cart c 
    JOIN figures f ON c.figure_id = f.id 
    WHERE c.user_id = ?
  `;
  db.query(query, [req.user.id], (err, results) => {
    if (err)
      return res.status(500).json({ message: "Error al obtener carrito" });
    const formattedResults = results.map((product) => ({
      ...product,
      imagen: `http://localhost/api/${product.imagen}`,
    }));
    res.json(formattedResults);
  });
});

app.post("/api/cart", authenticateToken, (req, res) => {
  const { figure_id } = req.body;
  const user_id = req.user.id;

  db.query(
    "SELECT * FROM cart WHERE user_id = ? AND figure_id = ?",
    [user_id, figure_id],
    (err, results) => {
      if (err)
        return res.status(500).json({ message: "Error actualizando carrito" });
      if (results.length > 0) {
        db.query(
          "UPDATE cart SET quantity = quantity + 1 WHERE user_id = ? AND figure_id = ?",
          [user_id, figure_id],
        );
      } else {
        db.query(
          "INSERT INTO cart (user_id, figure_id, quantity) VALUES (?, ?, 1)",
          [user_id, figure_id],
        );
      }
      res.json({ message: "Carrito actualizado" });
    },
  );
});

app.get("/api/users", authenticateAdmin, (req, res) => {
  const query = "SELECT id, username, email, role FROM users";
  db.query(query, (err, results) => {
    if (err)
      return res.status(500).json({ message: "Error al obtener usuarios" });
    res.json(results);
  });
});

app.delete("/api/users/:id", authenticateToken, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Acceso denegado" });

  db.query("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
    if (err)
      return res.status(500).json({ message: "Error al eliminar usuario" });
    res.json({ message: "Usuario eliminado" });
  });
});

// ============= GESTIÓN DE SESIONES (ADMIN) =============

// Obtener todas las sesiones activas (solo admin)
app.get("/api/sessions", authenticateAdmin, (req, res) => {
  // Obtener todas las sesiones activas con información del usuario
  db.query(
    `SELECT 
      s.id, 
      s.user_id, 
      u.username, 
      u.email, 
      u.role,
      s.user_agent, 
      s.created_at, 
      s.last_activity,
      s.active
     FROM user_sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.active = 1
     ORDER BY s.last_activity DESC`,
    (err, sessions) => {
      if (err) {
        return res.status(500).json({ message: "Error al obtener sesiones." });
      }
      res.json(sessions);
    },
  );
});

// Cerrar una sesión específica (solo admin)
app.post("/api/sessions/:sessionId/close", authenticateAdmin, (req, res) => {
  const userId = req.user.id;
  const sessionId = req.params.sessionId;

  // Verificar que sea admin
  db.query("SELECT role FROM users WHERE id = ?", [userId], (err, results) => {
    if (err || results.length === 0 || results[0].role !== "admin") {
      return res.status(403).json({
        message:
          "Acceso denegado. Solo administradores pueden cerrar sesiones.",
      });
    }

    // Cerrar la sesión
    db.query(
      "UPDATE user_sessions SET active = 0 WHERE id = ?",
      [sessionId],
      (err) => {
        if (err) {
          return res.status(500).json({ message: "Error al cerrar sesión." });
        }
        res.json({ message: "Sesión cerrada exitosamente." });
      },
    );
  });
});

// Cerrar todas las sesiones de un usuario específico (solo admin)
app.post(
  "/api/users/:userId/close-all-sessions",
  authenticateAdmin,
  (req, res) => {
    const adminId = req.user.id;
    const targetUserId = req.params.userId;

    // Verificar que sea admin
    db.query(
      "SELECT role FROM users WHERE id = ?",
      [adminId],
      (err, results) => {
        if (err || results.length === 0 || results[0].role !== "admin") {
          return res
            .status(403)
            .json({ message: "Acceso denegado. Solo administradores." });
        }

        // Cerrar todas las sesiones del usuario
        db.query(
          "UPDATE user_sessions SET active = 0 WHERE user_id = ?",
          [targetUserId],
          (err) => {
            if (err) {
              return res
                .status(500)
                .json({ message: "Error al cerrar sesiones." });
            }
            res.json({
              message: "Todas las sesiones del usuario han sido cerradas.",
            });
          },
        );
      },
    );
  },
);

app.use("/api/imagenes", express.static("public/images"));

app.listen(PORT, () =>
  console.log(`Servidor corriendo en http://localhost:${PORT}`),
);
