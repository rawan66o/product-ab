import React from "react";
import { useNavigate } from "react-router-dom";
import "./OnlinePayment.css";

import paymentQR from "./images/TT.jpeg";

function OnlinePayment() {
  const navigate = useNavigate();

  return (
    <div className="online-payment-page" dir="rtl">

      <div className="payment-card">

        {/* زر إغلاق الواجهة */}
        <button
          className="payment-close-btn"
          onClick={() => navigate("/products")}
          title="العودة للرئيسية"
          aria-label="إغلاق واجهة الدفع"
        >
          ×
        </button>

        <h2>💳 الدفع الإلكتروني</h2>

        <p className="payment-description">
          يمكنك الدفع إلكترونياً عن طريق مسح باركود الدفع
          باستخدام تطبيق الدفع الخاص بك.
        </p>

        <div className="payment-qr-container">
          <img
            src={paymentQR}
            alt="باركود الدفع الإلكتروني"
            className="payment-qr"
          />
        </div>

        <p className="payment-note">
          يرجى التأكد من إتمام عملية الدفع بنجاح.
        </p>

      </div>

    </div>
  );
}

export default OnlinePayment;