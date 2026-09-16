import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Checks.css";

// =================================
// API
// =================================

const API_URL =
  " https://abdbac2-6.onrender.com/checks";

// =================================
// Empty Form
// =================================

const emptyForm = {
  checkNumber: "",
  recipientName: "",
  signer: "",
  type: "شراء",
  totalAmount: "",
  productType: "",
  specifications: "",
  quantity: "",
  price: "",
  notes: "",
};

// =================================
// Check Form
// =================================

function CheckForm({
  formData,
  handleChange,
  onSubmit,
  buttonText,
}) {
  return (
    <form onSubmit={onSubmit}>

      {/* رقم الكشف */}

      <input
        type="text"
        name="checkNumber"
        placeholder="رقم الكشف"
        value={formData.checkNumber}
        onChange={handleChange}
        autoComplete="off"
        required
      />

      {/* اسم المستلم */}

      <input
        type="text"
        name="recipientName"
        placeholder="اسم المستلم"
        value={formData.recipientName}
        onChange={handleChange}
        autoComplete="off"
        required
      />

      {/* الموقّع */}

      <input
        type="text"
        name="signer"
        placeholder="اسم الموقّع"
        value={formData.signer}
        onChange={handleChange}
        autoComplete="off"
        required
      />

      {/* نوع الكشف */}

      <select
        name="type"
        value={formData.type}
        onChange={handleChange}
        required
      >
        <option value="شراء">
          شراء
        </option>

        <option value="بيع">
          بيع
        </option>
      </select>

      {/* القيمة الإجمالية */}

      <input
        type="number"
        name="totalAmount"
        placeholder="القيمة الإجمالية"
        value={formData.totalAmount}
        onChange={handleChange}
        min="0"
        required
      />

      {/* نوع البضاعة */}

      <input
        type="text"
        name="productType"
        placeholder="نوع البضاعة"
        value={formData.productType}
        onChange={handleChange}
        autoComplete="off"
        required
      />

      {/* المواصفات */}

      <input
        type="text"
        name="specifications"
        placeholder="مواصفات البضاعة"
        value={formData.specifications}
        onChange={handleChange}
        autoComplete="off"
      />

      {/* العدد */}

      <input
        type="number"
        name="quantity"
        placeholder="العدد"
        value={formData.quantity}
        onChange={handleChange}
        min="0"
        required
      />

      {/* السعر */}

      <input
        type="number"
        step="0.01"
        name="price"
        placeholder="السعر"
        value={formData.price}
        onChange={handleChange}
        min="0"
        required
      />

      {/* الملاحظات */}

      <textarea
        name="notes"
        placeholder="الملاحظات"
        value={formData.notes}
        onChange={handleChange}
        rows="4"
      />

      {/* زر الحفظ */}

      <button
        type="submit"
        className="save-check-btn"
      >
        {buttonText}
      </button>

    </form>
  );
}

// =================================
// Checks
// =================================

function Checks() {

  // =================================
  // User
  // =================================

  const user =
    localStorage.getItem("user");

  // =================================
  // States
  // =================================

  const [checks, setChecks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
    all       = كل الشيكات
    purchase  = شيكات الشراء
    sale      = شيكات البيع
  */

  const [filterType, setFilterType] =
    useState("all");

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [editId, setEditId] =
    useState(null);

  const [formData, setFormData] =
    useState(emptyForm);

  // =================================
  // GET CHECKS
  // =================================

  const getChecks = async () => {

    try {

      setLoading(true);

      const response =
        await axios.get(API_URL);

      if (Array.isArray(response.data)) {

        setChecks(response.data);

      } else {

        setChecks([]);

      }

      setError("");

    } catch (error) {

      console.log(error);

      setError(
        "حدث خطأ أثناء جلب الكشف"
      );

    } finally {

      setLoading(false);

    }

  };

  // =================================
  // LOAD
  // =================================

  useEffect(() => {

    getChecks();

  }, []);

  // =================================
  // HANDLE CHANGE
  // =================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

  };

  // =================================
  // ADD CHECK
  // =================================

  const handleAdd = async (e) => {

    e.preventDefault();

    try {

      // =================================
      // FIND MAX ID
      // =================================

      const numericIds = checks
        .map((check) =>
          Number(check.id)
        )
        .filter((id) =>
          Number.isFinite(id)
        );

      const maxId =
        numericIds.length > 0
          ? Math.max(...numericIds)
          : 0;

      const newId =
        String(maxId + 1);

      // =================================
      // NEW CHECK
      // =================================

      const newCheck = {

        id: newId,

        checkNumber:
          formData.checkNumber.trim(),

        recipientName:
          formData.recipientName.trim(),

        signer:
          formData.signer.trim(),

        type:
          formData.type.trim(),

        totalAmount:
          Number(
            formData.totalAmount || 0
          ),

        productType:
          formData.productType.trim(),

        specifications:
          formData.specifications.trim(),

        quantity:
          Number(
            formData.quantity || 0
          ),

        price:
          Number(
            formData.price || 0
          ),

        notes:
          formData.notes.trim(),

      };

      // =================================
      // POST
      // =================================

      const response =
        await axios.post(
          API_URL,
          newCheck
        );

      // =================================
      // UPDATE UI
      // =================================

      setChecks((prev) => [
        ...prev,
        response.data,
      ]);

      setShowAddForm(false);

      setFormData(
        emptyForm
      );

      alert(
        "تم إضافة الكشف بنجاح"
      );

    } catch (error) {

      console.log(error);

      alert(
        "حدث خطأ أثناء إضافة الكشف"
      );

    }

  };

  // =================================
  // DELETE CHECK
  // =================================

  const handleDelete = async (id) => {

    const confirmDelete =
      window.confirm(
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
            String(check.id) !==
            String(id)
        )
      );

      alert(
        "تم حذف الكشف بنجاح"
      );

    } catch (error) {

      console.log(error);

      alert(
        "حدث خطأ أثناء حذف الكشف"
      );

    }

  };

  // =================================
  // OPEN EDIT
  // =================================

  const handleEdit = (check) => {

    setEditId(
      check.id
    );

    setFormData({

      checkNumber:
        check.checkNumber || "",

      recipientName:
        check.recipientName || "",

      signer:
        check.signer || "",

      type:
        check.type || "شراء",

      totalAmount:
        check.totalAmount ?? "",

      productType:
        check.productType || "",

      specifications:
        check.specifications || "",

      quantity:
        check.quantity ?? "",

      price:
        check.price ?? "",

      notes:
        check.notes || "",

    });

  };

  // =================================
  // UPDATE CHECK
  // =================================

  const handleUpdate = async (e) => {

    e.preventDefault();

    try {

      const updatedCheck = {

        id: editId,

        checkNumber:
          formData.checkNumber.trim(),

        recipientName:
          formData.recipientName.trim(),

        signer:
          formData.signer.trim(),

        type:
          formData.type.trim(),

        totalAmount:
          Number(
            formData.totalAmount || 0
          ),

        productType:
          formData.productType.trim(),

        specifications:
          formData.specifications.trim(),

        quantity:
          Number(
            formData.quantity || 0
          ),

        price:
          Number(
            formData.price || 0
          ),

        notes:
          formData.notes.trim(),

      };

      // =================================
      // PUT
      // =================================

      const response =
        await axios.put(
          `${API_URL}/${editId}`,
          updatedCheck
        );

      // =================================
      // UPDATE UI
      // =================================

      setChecks((prev) =>
        prev.map((check) =>
          String(check.id) ===
          String(editId)
            ? response.data
            : check
        )
      );

      setEditId(null);

      setFormData(
        emptyForm
      );

      alert(
        "تم تعديل الكشف بنجاح"
      );

    } catch (error) {

      console.log(error);

      alert(
        "حدث خطأ أثناء تعديل الكشف"
      );

    }

  };

  // =================================
  // NORMALIZE API TYPE
  // =================================

  const getCheckType = (type) => {

    const value =
      String(type || "")
        .trim()
        .toLowerCase();

    // شراء
    if (
      value === "شراء" ||
      value === "buy" ||
      value === "purchase"
    ) {
      return "purchase";
    }

    // بيع
    if (
      value === "بيع" ||
      value === "sell" ||
      value === "sale"
    ) {
      return "sale";
    }

    return "";

  };

  // =================================
  // FILTER CHECKS
  // =================================

  const filteredChecks =
    checks.filter((check) => {

      // =================================
      // ALL
      // =================================

      if (
        filterType === "all"
      ) {
        return true;
      }

      // =================================
      // PURCHASE
      // =================================

      if (
        filterType === "purchase"
      ) {

        return (
          getCheckType(
            check.type
          ) === "purchase"
        );

      }

      // =================================
      // SALE
      // =================================

      if (
        filterType === "sale"
      ) {

        return (
          getCheckType(
            check.type
          ) === "sale"
        );

      }

      return true;

    });

  // =================================
  // LOADING
  // =================================

  if (loading) {

    return (
      <div className="checks-loading">
        جاري تحميل الكشف...
      </div>
    );

  }

  // =================================
  // RETURN
  // =================================

  return (

    <div className="checks-page">

      {/* =================================
          NAVBAR
      ================================= */}

      <nav className="store-navbar">

        <div className="store-logo">
          متجري
        </div>

        <div className="store-links">

          <Link to="/products">
            المنتجات
          </Link>

          {user ? (

            <Link
              to="/dashboard"
              className="admin-login-btn"
            >
              لوحة التحكم
            </Link>

          ) : (

            <Link
              to="/login"
              className="admin-login-btn"
            >
              🔐 تسجيل دخول الأدمن
            </Link>

          )}

        </div>

      </nav>


      {/* =================================
          CONTENT
      ================================= */}

      <div className="checks-content">

        {/* =================================
            HEADER
        ================================= */}

        <div className="checks-header">

          <div>

            <h1>
              الكشف
            </h1>

            <p>
              إدارة الكشف
            </p>

          </div>

          {user && (

            <button
              type="button"
              className="add-check-btn"
              onClick={() => {

                setFormData(
                  emptyForm
                );

                setShowAddForm(
                  true
                );

              }}
            >
              + إضافة شيك
            </button>

          )}

        </div>


        {/* =================================
            ERROR
        ================================= */}

        {error && (

          <div className="checks-error">
            {error}
          </div>

        )}


        {/* =================================
            FILTERS
        ================================= */}

        <div className="checks-filters">

          {/* الكل */}

          <button
            type="button"
            className={
              filterType === "all"
                ? "filter-btn active"
                : "filter-btn"
            }
            onClick={() =>
              setFilterType("all")
            }
          >
            كل الكشف
          </button>


          {/* شراء */}

          <button
            type="button"
            className={
              filterType === "purchase"
                ? "filter-btn active"
                : "filter-btn"
            }
            onClick={() =>
              setFilterType("purchase")
            }
          >
            شيكات الشراء
          </button>


          {/* بيع */}

          <button
            type="button"
            className={
              filterType === "sale"
                ? "filter-btn active"
                : "filter-btn"
            }
            onClick={() =>
              setFilterType("sale")
            }
          >
            شيكات البيع
          </button>

        </div>


        {/* =================================
            TABLE
        ================================= */}

        <div className="checks-table-container">

          <table className="checks-table">

            <thead>

              <tr>

                <th>
                  #
                </th>

                <th>
                  رقم الكشف
                </th>

                <th>
                  اسم المستلم
                </th>

                <th>
                  الموقّع
                </th>

                <th>
                  نوع الكشف
                </th>

                <th>
                  القيمة الإجمالية
                </th>

                <th>
                  نوع البضاعة
                </th>

                <th>
                  المواصفات
                </th>

                <th>
                  العدد
                </th>

                <th>
                  السعر
                </th>

                <th>
                  الملاحظات
                </th>

                {user && (
                  <th>
                    الإجراءات
                  </th>
                )}

              </tr>

            </thead>


            <tbody>

              {filteredChecks.map(
                (check, index) => {

                  const checkType =
                    getCheckType(
                      check.type
                    );

                  return (

                    <tr
                      key={check.id}
                    >

                      {/* # */}

                      <td data-label="#">
                        #{index + 1}
                      </td>


                      {/* رقم الكشف */}

                      <td data-label="رقم الكشف">
                        {check.checkNumber || "-"}
                      </td>


                      {/* اسم المستلم */}

                      <td data-label="اسم المستلم">
                        {check.recipientName || "-"}
                      </td>


                      {/* الموقّع */}

                      <td data-label="الموقّع">
                        {check.signer || "-"}
                      </td>


                      {/* نوع الكشف */}

                      <td data-label="نوع الكشف">

                        <span
                          className={
                            checkType === "purchase"
                              ? "check-type buy"
                              : checkType === "sale"
                              ? "check-type sell"
                              : "check-type"
                          }
                        >

                          {checkType === "purchase"
                            ? "شراء"
                            : checkType === "sale"
                            ? "بيع"
                            : check.type || "-"}

                        </span>

                      </td>


                      {/* القيمة الإجمالية */}

                      <td
                        data-label="القيمة الإجمالية"
                        className="total-cell"
                      >

                        {Number(
                          check.totalAmount || 0
                        ).toLocaleString()}

                        {" "}
                        ل.س

                      </td>


                      {/* نوع البضاعة */}

                      <td data-label="نوع البضاعة">
                        {check.productType || "-"}
                      </td>


                      {/* المواصفات */}

                      <td data-label="المواصفات">
                        {check.specifications || "-"}
                      </td>


                      {/* العدد */}

                      <td data-label="العدد">

                        {Number(
                          check.quantity || 0
                        ).toLocaleString()}

                      </td>


                      {/* السعر */}

                      <td data-label="السعر">
                        {check.price ?? "-"}
                      </td>


                      {/* الملاحظات */}

                      <td data-label="الملاحظات">
                        {check.notes || "-"}
                      </td>


                      {/* الإجراءات */}

                      {user && (

                        <td data-label="الإجراءات">

                          <div className="check-actions">

                            <button
                              type="button"
                              className="edit-check-btn"
                              onClick={() =>
                                handleEdit(
                                  check
                                )
                              }
                            >
                              تعديل
                            </button>

                            <button
                              type="button"
                              className="delete-check-btn"
                              onClick={() =>
                                handleDelete(
                                  check.id
                                )
                              }
                            >
                              حذف
                            </button>

                          </div>

                        </td>

                      )}

                    </tr>

                  );

                }
              )}


              {/* لا يوجد نتائج */}

              {filteredChecks.length === 0 && (

                <tr>

                  <td
                    colSpan={
                      user ? 12 : 11
                    }
                    className="empty-checks"
                  >
                    لا يوجد شيكات من هذا النوع
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* =================================
            ADD MODAL
        ================================= */}

        {showAddForm && user && (

          <div className="check-modal-overlay">

            <div className="check-modal">

              <button
                type="button"
                className="close-check-modal"
                onClick={() => {

                  setShowAddForm(
                    false
                  );

                  setFormData(
                    emptyForm
                  );

                }}
              >
                ×
              </button>

              <h2>
                إضافة شيك
              </h2>

              <CheckForm
                formData={formData}
                handleChange={handleChange}
                onSubmit={handleAdd}
                buttonText="إضافة الكشف"
              />

            </div>

          </div>

        )}


        {/* =================================
            EDIT MODAL
        ================================= */}

        {editId !== null && user && (

          <div className="check-modal-overlay">

            <div className="check-modal">

              <button
                type="button"
                className="close-check-modal"
                onClick={() => {

                  setEditId(null);

                  setFormData(
                    emptyForm
                  );

                }}
              >
                ×
              </button>

              <h2>
                تعديل الكشف
              </h2>

              <CheckForm
                formData={formData}
                handleChange={handleChange}
                onSubmit={handleUpdate}
                buttonText="حفظ التعديل"
              />

            </div>

          </div>

        )}

      </div>

    </div>

  );
}

export default Checks;