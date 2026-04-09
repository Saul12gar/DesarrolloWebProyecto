import React from "react";
import "../scss/modal.scss"; // Import custom styles for the modal

const Modal = ({ id, title, body, footer, onClose }) => {
  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div
        className="custom-modal-content"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="custom-modal-header">
          <h5>{title}</h5>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
          ></button>
        </div>
        <div className="custom-modal-body">{body}</div>
        <div className="custom-modal-footer">{footer}</div>
      </div>
    </div>
  );
};

export default Modal;
