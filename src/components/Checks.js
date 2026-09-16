
import { useEffect, useState } from "react";
import axios from "axios";
import "./Checks.css";

function Checks() {
  const API_URL = "https://abdo-1-rrgy.onrender.com/checks";

  // =================================
  // User
  // =================================

  const user = localStorage.getItem("user");

  // =================================
  // Checks
  // =================================

  const [checks, setChecks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =================================
  // Filter
  // =================================

  const [filterType, setFilterType] = useState("all");

  // =================================
  // Modals
  // =================================

  const [showAddForm, setShowAddForm] = useState(false);

  const [editId, setEditId] = useState(null);

  // =================================
  // Form
  // =================================

  const emptyForm = {
    type: "شراء",
    totalAmount: "",
    productType: "",
    specifications: "",
    quantity: "",
    price: "",
    notes: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  // =================================
  // GET Checks
  // =================================

  const getChecks = async () => {
    try {
      setLoading(true);

      const response = await axios.get(API_URL);

      setChecks(response.data);

      setError("");
    } catch (error) {
      console.log(error);

      setError("حدث خطأ أثناء جلب الشيكات");
    } finally {
      setLoading(false);
    }
  };

  // =================================
  // Load
  // =================================

  useEffect(() => {
    getChecks();
  }, []);

  // =================================
  // Handle Input
  // =================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // =================================
  // ADD CHECK
  // =================================

  const handleAdd = async (e) => {
    e.preventDefault();

    try {
      const newCheck = {
        type: formData.type,

        totalAmount: Number(formData.totalAmount || 0),

        productType: formData.productType,

        specifications: formData.specifications,

        quantity: Number(formData.quantity || 0),

        price: Number(formData.price || 0),

        notes: formData.notes,
      };

      const response = await axios.post(API_URL, newCheck);

      setChecks((prev) => [...prev, response.data]);

      setShowAddForm(false);

      setFormData(emptyForm);

      alert("تم إضافة الشيك بنجاح");
    } catch (error) {
      console.log(error);

      alert("حدث خطأ أثناء إضافة الشيك");
    }
  };

  // =================================
  // DELETE CHECK
  // =================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "هل أنت متأكد من حذف هذا الشيك؟"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);

      setChecks((prev) =>
        prev.filter((check) => check.id !== id)
      );

      alert("تم حذف الشيك بنجاح");
    } catch (error) {
      console.log(error);

      alert("حدث خطأ أثناء حذف الشيك");
    }
  };

  // =================================
  // OPEN EDIT
  // =================================

  const handleEdit = (check) => {
    setEditId(check.id);

    setFormData({
      type: check.type || "شراء",

      totalAmount: check.totalAmount ?? "",

      productType: check.productType || "",

      specifications: check.specifications || "",

      quantity: check.quantity ?? "",

      price: check.price ?? "",

      notes: check.notes || "",
    });
  };

  // =================================
  // UPDATE CHECK
  // =================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const updatedCheck = {
        type: formData.type,

        totalAmount: Number(formData.totalAmount || 0),

        productType: formData.productType,

        specifications: formData.specifications,

        quantity: Number(formData.quantity || 0),

        price: Number(formData.price || 0),

        notes: formData.notes,
      };

      const response = await axios.put(
        `${API_URL}/${editId}`,
        updatedCheck
      );

      setChecks((prev) =>
        prev.map((check) =>
          check.id === editId ? response.data : check
        )
      );

      setEditId(null);

      setFormData(emptyForm);

      alert("تم تعديل الشيك بنجاح");
    } catch (error) {
      console.log(error);

      alert("حدث خطأ أثناء تعديل الشيك");
    }
  };

  // =================================
  // FILTER
  // =================================

  const filteredChecks = checks.filter((check) => {
    if (filterType === "all") {
      return true;
    }

    return check.type === filterType;
  });

  // =================================
  // Loading
  // =================================

  if (loading) {
    return (
      <div className="checks-loading">
        جاري تحميل الشيكات...
      </div>
    );
  }

  // =================================
  // Return
  // =================================

  return (
    <div className="checks-page">

      {/* =================================
          Header
      ================================= */}

      <div className="checks-header">

        <div>
          <h1>الشيكات</h1>

          <p>
            إدارة شيكات الشراء والبيع
          </p>
        </div>

        {user && (
          <button
            className="add-check-btn"
            onClick={() => {
              setFormData(emptyForm);
              setShowAddForm(true);
            }}
          >
            + إضافة شيك
          </button>
        )}

      </div>

      {/* =================================
          Error
      ================================= */}

      {error && (
        <div className="checks-error">
          {error}
        </div>
      )}

      {/* =================================
          Filters
      ================================= */}

      <div className="checks-filters">

        <button
          className={
            filterType === "all"
              ? "filter-btn active"
              : "filter-btn"
          }
          onClick={() => setFilterType("all")}
        >
          كل الشيكات
        </button>

        <button
          className={
            filterType === "شراء"
              ? "filter-btn active"
              : "filter-btn"
          }
          onClick={() => setFilterType("شراء")}
        >
          شيكات الشراء
        </button>

        <button
          className={
            filterType === "بيع"
              ? "filter-btn active"
              : "filter-btn"
          }
          onClick={() => setFilterType("بيع")}
        >
          شيكات البيع
        </button>

      </div>

      {/* =================================
          Table
      ================================= */}

      <div className="checks-table-container">

        <table className="checks-table">

          <thead>

            <tr>

              <th>رقم</th>

              <th>نوع الشيك</th>

              <th>القيمة الإجمالية</th>

              <th>نوع البضاعة</th>

              <th>المواصفات</th>

              <th>العدد</th>

              <th>السعر</th>

              <th>الملاحظات</th>

              {user && (
                <th>الإجراءات</th>
              )}

            </tr>

          </thead>

          <tbody>

            {filteredChecks.map((check) => (

              <tr key={check.id}>

                <td>
                  #{check.id}
                </td>

                <td>

                  <span
                    className={
                      check.type === "شراء"
                        ? "check-type buy"
                        : "check-type sell"
                    }
                  >
                    {check.type}
                  </span>

                </td>

                <td className="total-cell">
                  {Number(
                    check.totalAmount || 0
                  ).toLocaleString()} ل.س
                </td>

                <td>
                  {check.productType}
                </td>

                <td>
                  {check.specifications || "-"}
                </td>

                <td>
                  {Number(
                    check.quantity || 0
                  ).toLocaleString()}
                </td>

                <td>
                  {check.price}
                </td>

                <td>
                  {check.notes || "-"}
                </td>

                {user && (

                  <td>

                    <div className="check-actions">

                      <button
                        className="edit-check-btn"
                        onClick={() =>
                          handleEdit(check)
                        }
                      >
                        تعديل
                      </button>

                      <button
                        className="delete-check-btn"
                        onClick={() =>
                          handleDelete(check.id)
                        }
                      >
                        حذف
                      </button>

                    </div>

                  </td>

                )}

              </tr>

            ))}

            {filteredChecks.length === 0 && (

              <tr>

                <td
                  colSpan={user ? 9 : 8}
                  className="empty-checks"
                >
                  لا يوجد شيكات
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
              className="close-check-modal"
              onClick={() =>
                setShowAddForm(false)
              }
            >
              ×
            </button>

            <h2>
              إضافة شيك
            </h2>

            <form onSubmit={handleAdd}>

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

              <input
                type="number"
                name="totalAmount"
                placeholder="القيمة الإجمالية"
                value={formData.totalAmount}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="productType"
                placeholder="نوع البضاعة"
                value={formData.productType}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="specifications"
                placeholder="مواصفات البضاعة"
                value={formData.specifications}
                onChange={handleChange}
              />

              <input
                type="number"
                name="quantity"
                placeholder="العدد"
                value={formData.quantity}
                onChange={handleChange}
                required
              />

              <input
                type="number"
                step="0.01"
                name="price"
                placeholder="السعر"
                value={formData.price}
                onChange={handleChange}
                required
              />

              <textarea
                name="notes"
                placeholder="الملاحظات"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
              />

              <button
                type="submit"
                className="save-check-btn"
              >
                إضافة الشيك
              </button>

            </form>

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
              className="close-check-modal"
              onClick={() =>
                setEditId(null)
              }
            >
              ×
            </button>

            <h2>
              تعديل الشيك
            </h2>

            <form onSubmit={handleUpdate}>

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

              <input
                type="number"
                name="totalAmount"
                placeholder="القيمة الإجمالية"
                value={formData.totalAmount}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="productType"
                placeholder="نوع البضاعة"
                value={formData.productType}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="specifications"
                placeholder="مواصفات البضاعة"
                value={formData.specifications}
                onChange={handleChange}
              />

              <input
                type="number"
                name="quantity"
                placeholder="العدد"
                value={formData.quantity}
                onChange={handleChange}
                required
              />

              <input
                type="number"
                step="0.01"
                name="price"
                placeholder="السعر"
                value={formData.price}
                onChange={handleChange}
                required
              />

              <textarea
                name="notes"
                placeholder="الملاحظات"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
              />

              <button
                type="submit"
                className="save-check-btn"
              >
                حفظ التعديل
              </button>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Checks;

