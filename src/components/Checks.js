import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Checks.css";

const API_URL = "https://abdbac2-10.onrender.com/checks";

// =========================================
// الفورم الفارغ
// =========================================

const emptyForm = {
  checkNumber: "",
  recipientName: "",
  signer: "",
  date: "",
  دفترNumber: "",
  type: "شراء",
  totalAmount: "",
  productType: "",
  specifications: "",
  quantity: "",
  price: "",
  notes: "",
};

// =========================================
// تنسيق الأرقام
// =========================================

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const cleanValue = String(value).replace(/,/g, "");

  if (!/^\d*\.?\d*$/.test(cleanValue)) {
    return String(value);
  }

  const parts = cleanValue.split(".");
  const integerPart = parts[0] || "0";
  const decimalPart = parts[1];

  const formattedInteger = Number(integerPart).toLocaleString("en-US");

  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  }

  return formattedInteger;
};

// =========================================
// إزالة الفواصل
// =========================================

const removeCommas = (value) => {
  return String(value || "").replace(/,/g, "");
};

// =========================================
// تحويل إلى رقم
// =========================================

const toNumber = (value) => {
  const cleaned = removeCommas(value);

  if (cleaned === "") {
    return 0;
  }

  return Number(cleaned);
};

// =========================================
// فورم الكشف
// =========================================

function CheckForm({
  formData,
  handleChange,
  handleSubmit,
  closeForm,
  editMode,
  selectedCustomer,
}) {
  return (
    <div className="modal-overlay">
      <div className="modal">

        {/* Header */}
        <div className="modal-header">
          <h2>
            {editMode
              ? "تعديل الكشف"
              : selectedCustomer
              ? `إضافة كشف جديد لـ ${selectedCustomer}`
              : "إضافة كشف جديد"}
          </h2>

          <button
            type="button"
            className="close-modal"
            onClick={closeForm}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form className="check-form" onSubmit={handleSubmit}>

          {/* رقم الكشف */}
          <div className="form-group">
            <label>رقم الكشف</label>

            <input
              type="text"
              name="checkNumber"
              value={formData.checkNumber}
              onChange={handleChange}
              placeholder="أدخل رقم الكشف"
              required
            />
          </div>

          {/* اسم المستلم */}
          <div className="form-group">
            <label>اسم المستلم</label>

            <input
              type="text"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              placeholder="اسم المستلم"
              required
              disabled={!!selectedCustomer && !editMode}
            />
          </div>

          {/* الموقّع */}
          <div className="form-group">
            <label>الموقّع</label>

            <input
              type="text"
              name="signer"
              value={formData.signer}
              onChange={handleChange}
              placeholder="اسم الموقّع"
              required
            />
          </div>

          {/* التاريخ */}
          <div className="form-group">
            <label>تاريخ الكشف</label>

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          {/* رقم الدفتر */}
          <div className="form-group">
            <label>رقم الدفتر</label>

            <input
              type="text"
              name="دفترNumber"
              value={formData.دفترNumber}
              onChange={handleChange}
              placeholder="أدخل رقم الدفتر"
            />
          </div>

          {/* نوع الكشف */}
          <div className="form-group">
            <label>نوع الكشف</label>

            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="شراء">شراء</option>
              <option value="بيع">بيع</option>
            </select>
          </div>

          {/* القيمة الإجمالية */}
          <div className="form-group">
            <label>القيمة الإجمالية</label>

            <input
              type="text"
              inputMode="numeric"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleChange}
              placeholder="مثال: 2,500,000"
              required
            />
          </div>

          {/* نوع البضاعة */}
          <div className="form-group">
            <label>نوع البضاعة</label>

            <input
              type="text"
              name="productType"
              value={formData.productType}
              onChange={handleChange}
              placeholder="نوع البضاعة"
            />
          </div>

          {/* المواصفات */}
          <div className="form-group full-width">
            <label>المواصفات</label>

            <input
              type="text"
              name="specifications"
              value={formData.specifications}
              onChange={handleChange}
              placeholder="المواصفات"
            />
          </div>

          {/* العدد */}
          <div className="form-group">
            <label>العدد</label>

            <input
              type="text"
              inputMode="numeric"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="مثال: 2,500"
            />
          </div>

          {/* السعر */}
          <div className="form-group">
            <label>السعر</label>

            <input
              type="text"
              inputMode="decimal"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="مثال: 1.7"
            />
          </div>

          {/* الملاحظات */}
          <div className="form-group full-width">
            <label>الملاحظات</label>

            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="أدخل الملاحظات..."
            />
          </div>

          {/* الأزرار */}
          <div className="form-actions">

            <button
              type="submit"
              className="btn btn-save"
            >
              {editMode ? "حفظ التعديل" : "إضافة الكشف"}
            </button>

            <button
              type="button"
              className="btn btn-cancel"
              onClick={closeForm}
            >
              إلغاء
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

// =========================================
// الصفحة الرئيسية
// =========================================

function Checks() {
  const [checks, setChecks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [filterType, setFilterType] = useState("all");

  const [showAddForm, setShowAddForm] = useState(false);

  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  // الزبون الذي نريد إضافة كشف له
  const [selectedCustomer, setSelectedCustomer] = useState("");

  // الكشف المفتوح للتفاصيل
  const [openedCheck, setOpenedCheck] = useState(null);

  // =========================================
  // جلب الكشوف
  // =========================================

  const getChecks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(API_URL);

      if (Array.isArray(response.data)) {
        setChecks(response.data);
      } else {
        setChecks([]);
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء جلب الكشوف");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getChecks();
  }, []);

  // =========================================
  // تغيير الفورم
  // =========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    const numberFields = [
      "totalAmount",
      "quantity",
      "price",
    ];

    if (numberFields.includes(name)) {
      let cleanValue = value.replace(/[^\d.]/g, "");

      const parts = cleanValue.split(".");

      if (parts.length > 2) {
        cleanValue =
          parts[0] +
          "." +
          parts.slice(1).join("");
      }

      setFormData((prev) => ({
        ...prev,
        [name]: formatNumber(cleanValue),
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================
  // فتح فورم إضافة كشف
  // =========================================

  const openAddForm = (customerName = "") => {
    setSelectedCustomer(customerName);

    setFormData({
      ...emptyForm,
      recipientName: customerName,
      date: new Date().toISOString().split("T")[0],
    });

    setEditId(null);
    setShowAddForm(true);
  };

  // =========================================
  // إغلاق الفورم
  // =========================================

  const closeForm = () => {
    setShowAddForm(false);

    setEditId(null);

    setSelectedCustomer("");

    setFormData(emptyForm);
  };

  // =========================================
  // إضافة كشف
  // =========================================

  const handleAdd = async (e) => {
    e.preventDefault();

    try {
      const numericIds = checks
        .map((check) => Number(check.id))
        .filter((id) => !isNaN(id));

      const maxId =
        numericIds.length > 0
          ? Math.max(...numericIds)
          : 0;

      const newCheck = {
        id: String(maxId + 1),

        checkNumber:
          formData.checkNumber,

        recipientName:
          formData.recipientName.trim(),

        signer:
          formData.signer,

        date:
          formData.date,

        دفترNumber:
          formData.دفترNumber,

        type:
          formData.type,

        totalAmount:
          toNumber(formData.totalAmount),

        productType:
          formData.productType,

        specifications:
          formData.specifications,

        quantity:
          toNumber(formData.quantity),

        price:
          toNumber(formData.price),

        notes:
          formData.notes,
      };

      const response = await axios.post(
        API_URL,
        newCheck
      );

      setChecks((prev) => [
        ...prev,
        response.data,
      ]);

      closeForm();

      alert("تمت إضافة الكشف بنجاح");

    } catch (err) {
      console.error(err);

      alert("حدث خطأ أثناء إضافة الكشف");
    }
  };

  // =========================================
  // حذف كشف
  // =========================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "هل أنت متأكد من حذف هذا الكشف؟"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/${id}`
      );

      setChecks((prev) =>
        prev.filter(
          (check) =>
            String(check.id) !== String(id)
        )
      );

      if (
        openedCheck &&
        String(openedCheck.id) === String(id)
      ) {
        setOpenedCheck(null);
      }

      alert("تم حذف الكشف بنجاح");

    } catch (err) {
      console.error(err);

      alert("حدث خطأ أثناء حذف الكشف");
    }
  };

  // =========================================
  // فتح التعديل
  // =========================================

  const handleEdit = (check) => {
    setEditId(check.id);

    setSelectedCustomer(
      check.recipientName || ""
    );

    setFormData({
      checkNumber:
        check.checkNumber || "",

      recipientName:
        check.recipientName || "",

      signer:
        check.signer || "",

      date:
        check.date || "",

      دفترNumber:
        check.دفترNumber || "",

      type:
        check.type || "شراء",

      totalAmount:
        formatNumber(check.totalAmount),

      productType:
        check.productType || "",

      specifications:
        check.specifications || "",

      quantity:
        formatNumber(check.quantity),

      price:
        formatNumber(check.price),

      notes:
        check.notes || "",
    });

    setShowAddForm(true);
  };

  // =========================================
  // تعديل كشف
  // =========================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const updatedCheck = {
        checkNumber:
          formData.checkNumber,

        recipientName:
          formData.recipientName.trim(),

        signer:
          formData.signer,

        date:
          formData.date,

        دفترNumber:
          formData.دفترNumber,

        type:
          formData.type,

        totalAmount:
          toNumber(formData.totalAmount),

        productType:
          formData.productType,

        specifications:
          formData.specifications,

        quantity:
          toNumber(formData.quantity),

        price:
          toNumber(formData.price),

        notes:
          formData.notes,
      };

      const response = await axios.put(
        `${API_URL}/${editId}`,
        updatedCheck
      );

      setChecks((prev) =>
        prev.map((check) =>
          String(check.id) === String(editId)
            ? response.data
            : check
        )
      );

      closeForm();

      alert("تم تعديل الكشف بنجاح");

    } catch (err) {
      console.error(err);

      alert("حدث خطأ أثناء تعديل الكشف");
    }
  };

  // =========================================
  // تحديد نوع الكشف
  // =========================================

  const getCheckType = (type) => {
    const value = String(
      type || ""
    ).toLowerCase();

    if (
      value === "شراء" ||
      value === "purchase"
    ) {
      return "شراء";
    }

    if (
      value === "بيع" ||
      value === "sale"
    ) {
      return "بيع";
    }

    return type;
  };

  // =========================================
  // فلترة الكشوف
  // =========================================

  const filteredChecks =
    filterType === "all"
      ? checks
      : checks.filter(
          (check) =>
            getCheckType(check.type) ===
            filterType
        );

  // =========================================
  // تجميع الكشوف حسب الزبون
  // =========================================

  const customers = Array.from(
    new Set(
      filteredChecks
        .map(
          (check) =>
            check.recipientName?.trim()
        )
        .filter(Boolean)
    )
  );

  // =========================================
  // معرفة كشوف كل زبون
  // =========================================

  const getCustomerChecks = (
    customerName
  ) => {
    return filteredChecks.filter(
      (check) =>
        String(
          check.recipientName || ""
        ).trim() ===
        String(customerName).trim()
    );
  };

  // =========================================
  // فتح تفاصيل كشف
  // =========================================

  const openCheck = (check) => {
    setOpenedCheck(check);
  };

  // =========================================
  // JSX
  // =========================================

  return (
    <div className="checks-page">

      {/* =====================================
          Navbar
      ===================================== */}

      <nav className="store-navbar">

        <div className="store-logo">
          متجري
        </div>

        <div className="store-links">

          <Link to="/products">
            المنتجات
          </Link>

          <Link to="/checks">
            الكشوف
          </Link>

          <Link to="/dashboard">
            الداشبورد
          </Link>

        </div>

      </nav>

      {/* =====================================
          Main
      ===================================== */}

      <main className="checks-container">

        {/* Header */}

        <div className="checks-header">

          <div>

            <h1>
              كشوف الزبائن
            </h1>

            <p>
              يمكنك إضافة أكثر من كشف لكل زبون
            </p>

          </div>

          <button
            className="btn btn-add"
            onClick={() =>
              openAddForm("")
            }
          >
            + إضافة كشف
          </button>

        </div>

        {/* Error */}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* =====================================
            Filter
        ===================================== */}

        <div className="checks-filter">

          <span>
            فلترة:
          </span>

          <button
            className={`filter-btn ${
              filterType === "all"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilterType("all")
            }
          >
            الكل
          </button>

          <button
            className={`filter-btn ${
              filterType === "شراء"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilterType("شراء")
            }
          >
            شراء
          </button>

          <button
            className={`filter-btn ${
              filterType === "بيع"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilterType("بيع")
            }
          >
            بيع
          </button>

        </div>

        {/* =====================================
            Loading
        ===================================== */}

        {loading ? (

          <div className="loading">
            جاري تحميل الكشوف...
          </div>

        ) : customers.length === 0 ? (

          <div className="empty-state">

            <div className="empty-state-icon">
              🧾
            </div>

            <h3>
              لا يوجد كشوف
            </h3>

            <p>
              أضف أول كشف للبدء
            </p>

          </div>

        ) : (

          <div className="customers-checks">

            {customers.map(
              (customerName) => {

                const customerChecks =
                  getCustomerChecks(
                    customerName
                  );

                return (

                  <div
                    className="customer-section"
                    key={customerName}
                  >

                    {/* اسم الزبون */}

                    <div className="customer-section-header">

                      <div className="customer-info">

                        <div className="customer-icon">
                          👤
                        </div>

                        <div>

                          <h2>
                            {customerName}
                          </h2>

                          <span>
                            {
                              customerChecks.length
                            } كشف
                          </span>

                        </div>

                      </div>

                      {/* زر + */}

                      <button
                        className="add-check-small"
                        onClick={() =>
                          openAddForm(
                            customerName
                          )
                        }
                        title="إضافة كشف جديد لهذا الزبون"
                      >
                        +
                      </button>

                    </div>

                    {/* =====================================
                        الكشوف
                    ===================================== */}

                    <div className="customer-checks-grid">

                      {customerChecks.map(
                        (check) => (

                          <div
                            className="check-card"
                            key={check.id}
                          >

                            {/* أعلى الكرت */}

                            <div className="check-card-top">

                              <div className="check-number">

                                <span>
                                  رقم الكشف
                                </span>

                                <strong>
                                  #
                                  {
                                    check.checkNumber
                                  }
                                </strong>

                              </div>

                              <span
                                className={`check-type ${
                                  getCheckType(
                                    check.type
                                  ) ===
                                  "شراء"
                                    ? "purchase"
                                    : "sale"
                                }`}
                              >
                                {
                                  getCheckType(
                                    check.type
                                  )
                                }
                              </span>

                            </div>

                            {/* التاريخ ورقم الدفتر */}

                            <div className="check-card-extra">

                              <div>

                                <span>
                                  التاريخ
                                </span>

                                <strong>
                                  {check.date || "-"}
                                </strong>

                              </div>

                              <div>

                                <span>
                                  رقم الدفتر
                                </span>

                                <strong>
                                  {check.دفترNumber || "-"}
                                </strong>

                              </div>

                            </div>

                            {/* القيمة */}

                            <div className="check-amount">

                              <span>
                                القيمة الإجمالية
                              </span>

                              <strong>
                                {formatNumber(
                                  check.totalAmount
                                )}
                              </strong>

                            </div>

                            {/* معلومات */}

                            <div className="check-details">

                              <div>

                                <span>
                                  الموقّع
                                </span>

                                <strong>
                                  {check.signer || "-"}
                                </strong>

                              </div>

                              <div>

                                <span>
                                  نوع البضاعة
                                </span>

                                <strong>
                                  {
                                    check.productType ||
                                    "-"
                                  }
                                </strong>

                              </div>

                              <div>

                                <span>
                                  العدد
                                </span>

                                <strong>
                                  {formatNumber(
                                    check.quantity
                                  ) || "-"}
                                </strong>

                              </div>

                              <div>

                                <span>
                                  السعر
                                </span>

                                <strong>
                                  {formatNumber(
                                    check.price
                                  ) || "-"}
                                </strong>

                              </div>

                            </div>

                            {/* الأزرار */}

                            <div className="check-card-actions">

                              <button
                                className="view-btn"
                                onClick={() =>
                                  openCheck(
                                    check
                                  )
                                }
                              >
                                👁 عرض
                              </button>

                              <button
                                className="edit-btn"
                                onClick={() =>
                                  handleEdit(
                                    check
                                  )
                                }
                              >
                                ✏ تعديل
                              </button>

                              <button
                                className="delete-btn"
                                onClick={() =>
                                  handleDelete(
                                    check.id
                                  )
                                }
                              >
                                🗑 حذف
                              </button>

                            </div>

                          </div>

                        )
                      )}

                      {/* =====================================
                          كرت إضافة كشف جديد
                      ===================================== */}

                      <button
                        className="new-check-card"
                        onClick={() =>
                          openAddForm(
                            customerName
                          )
                        }
                      >

                        <span>
                          +
                        </span>

                        <strong>
                          كشف جديد
                        </strong>

                        <small>
                          إضافة كشف لنفس الزبون
                        </small>

                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </main>

      {/* =====================================
          Add / Edit Modal
      ===================================== */}

      {showAddForm && (

        <CheckForm
          formData={formData}
          handleChange={handleChange}
          handleSubmit={
            editId
              ? handleUpdate
              : handleAdd
          }
          closeForm={closeForm}
          editMode={!!editId}
          selectedCustomer={
            selectedCustomer
          }
        />

      )}

      {/* =====================================
          View Check Modal
      ===================================== */}

      {openedCheck && (

        <div className="modal-overlay">

          <div className="modal check-view-modal">

            {/* Header */}

            <div className="modal-header">

              <h2>
                تفاصيل الكشف #
                {
                  openedCheck.checkNumber
                }
              </h2>

              <button
                type="button"
                className="close-modal"
                onClick={() =>
                  setOpenedCheck(null)
                }
              >
                ×
              </button>

            </div>

            {/* Details */}

            <div className="check-view">

              {/* اسم المستلم */}

              <div className="view-row">

                <span>
                  اسم المستلم
                </span>

                <strong>
                  {
                    openedCheck.recipientName ||
                    "-"
                  }
                </strong>

              </div>

              {/* رقم الكشف */}

              <div className="view-row">

                <span>
                  رقم الكشف
                </span>

                <strong>
                  {
                    openedCheck.checkNumber ||
                    "-"
                  }
                </strong>

              </div>

              {/* التاريخ */}

              <div className="view-row">

                <span>
                  التاريخ
                </span>

                <strong>
                  {
                    openedCheck.date ||
                    "-"
                  }
                </strong>

              </div>

              {/* رقم الدفتر */}

              <div className="view-row">

                <span>
                  رقم الدفتر
                </span>

                <strong>
                  {
                    openedCheck.دفترNumber ||
                    "-"
                  }
                </strong>

              </div>

              {/* الموقّع */}

              <div className="view-row">

                <span>
                  الموقّع
                </span>

                <strong>
                  {
                    openedCheck.signer ||
                    "-"
                  }
                </strong>

              </div>

              {/* نوع الكشف */}

              <div className="view-row">

                <span>
                  نوع الكشف
                </span>

                <strong>
                  {
                    getCheckType(
                      openedCheck.type
                    )
                  }
                </strong>

              </div>

              {/* القيمة */}

              <div className="view-row">

                <span>
                  القيمة الإجمالية
                </span>

                <strong className="big-amount">

                  {formatNumber(
                    openedCheck.totalAmount
                  )}

                </strong>

              </div>

              {/* نوع البضاعة */}

              <div className="view-row">

                <span>
                  نوع البضاعة
                </span>

                <strong>
                  {
                    openedCheck.productType ||
                    "-"
                  }
                </strong>

              </div>

              {/* المواصفات */}

              <div className="view-row">

                <span>
                  المواصفات
                </span>

                <strong>
                  {
                    openedCheck.specifications ||
                    "-"
                  }
                </strong>

              </div>

              {/* العدد */}

              <div className="view-row">

                <span>
                  العدد
                </span>

                <strong>
                  {formatNumber(
                    openedCheck.quantity
                  ) || "-"}
                </strong>

              </div>

              {/* السعر */}

              <div className="view-row">

                <span>
                  السعر
                </span>

                <strong>
                  {formatNumber(
                    openedCheck.price
                  ) || "-"}
                </strong>

              </div>

              {/* الملاحظات */}

              <div className="view-row">

                <span>
                  الملاحظات
                </span>

                <strong>
                  {
                    openedCheck.notes ||
                    "-"
                  }
                </strong>

              </div>

            </div>

            {/* Actions */}

            <div className="view-actions">

              <button
                className="btn btn-edit"
                onClick={() => {

                  setOpenedCheck(null);

                  handleEdit(
                    openedCheck
                  );

                }}
              >
                ✏ تعديل الكشف
              </button>

              <button
                className="btn btn-cancel"
                onClick={() =>
                  setOpenedCheck(null)
                }
              >
                إغلاق
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Checks;