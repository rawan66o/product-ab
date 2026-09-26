import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Capital.css";
import { Link } from "react-router-dom";
const API_URL = "https://abdbac2-10.onrender.com/capital";

const emptyForm = {
  name: "",
  type: "",
  size: "",
  color: "",
  price_usd: "",
  price_syp: "",
  quantity: "",
};

function Capital() {
  const [capital, setCapital] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  // ========================================
  // جلب رأس المال
  // ========================================

  const fetchCapital = async () => {
    try {
      setLoading(true);

      const response = await axios.get(API_URL);

      setCapital(response.data);
    } catch (error) {
      console.error("خطأ أثناء جلب رأس المال:", error);
      alert("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapital();
  }, []);

  // ========================================
  // تغيير الحقول
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ========================================
  // فتح إضافة
  // ========================================

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  // ========================================
  // فتح تعديل
  // ========================================

  const openEditModal = (item) => {
    setEditingId(item.id);

    setForm({
      name: item.name || "",
      type: item.type || "",
      size: item.size || "",
      color: item.color || "",
      price_usd:
        item.price_usd !== undefined &&
        item.price_usd !== null
          ? item.price_usd
          : "",
      price_syp:
        item.price_syp !== undefined &&
        item.price_syp !== null
          ? item.price_syp
          : "",
      quantity: item.quantity || "",
    });

    setShowModal(true);
  };

  // ========================================
  // إغلاق المودال
  // ========================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  // ========================================
  // إضافة / تعديل
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("يرجى إدخال اسم المنتج");
      return;
    }

    if (!form.type.trim()) {
      alert("يرجى إدخال النوع");
      return;
    }

    if (!form.size.trim()) {
      alert("يرجى إدخال القياس");
      return;
    }

    if (!form.quantity.toString().trim()) {
      alert("يرجى إدخال الكمية");
      return;
    }

    try {
      setSaving(true);

      const data = {
        name: form.name.trim(),
        type: form.type.trim(),
        size: form.size.trim(),
        color: form.color.trim(),

        price_usd:
          form.price_usd === ""
            ? 0
            : Number(form.price_usd),

        price_syp:
          form.price_syp === ""
            ? 0
            : Number(form.price_syp),

        quantity: form.quantity.toString().trim(),
      };

      if (editingId) {
        await axios.put(
          `${API_URL}/${editingId}`,
          data
        );
      } else {
        await axios.post(API_URL, data);
      }

      await fetchCapital();

      closeModal();
    } catch (error) {
      console.error("خطأ أثناء حفظ البيانات:", error);

      alert("حدث خطأ أثناء حفظ البيانات");
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // حذف
  // ========================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "هل أنت متأكد من حذف هذا المنتج من رأس المال؟"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/${id}`);

      setCapital((prev) =>
        prev.filter((item) => item.id !== id)
      );
    } catch (error) {
      console.error("خطأ أثناء الحذف:", error);

      alert("حدث خطأ أثناء حذف المنتج");
    }
  };

  // ========================================
  // البحث
  // ========================================

  const filteredCapital = capital.filter((item) => {
    const searchText = search
      .toLowerCase()
      .trim();

    if (!searchText) return true;

    return (
      item.name
        ?.toLowerCase()
        .includes(searchText) ||
      item.type
        ?.toLowerCase()
        .includes(searchText) ||
      item.size
        ?.toLowerCase()
        .includes(searchText) ||
      item.color
        ?.toLowerCase()
        .includes(searchText)
    );
  });

  // ========================================
  // عرض
  // ========================================

  return (
    <div className="capital-page" dir="rtl">

      {/* =====================================
          Header
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
      <br/>
      <div className="capital-header">

        <div>
          <h1>رأس المال</h1>

          <p>
            إدارة المنتجات الموجودة ضمن رأس المال
          </p>
        </div>

        <button
          type="button"
          className="add-capital-btn"
          onClick={openAddModal}
        >
          + إضافة منتج
        </button>

      </div>

      {/* =====================================
          Stats
      ===================================== */}

      <div className="capital-stats">

        <div className="capital-stat-card">

          <span className="stat-title">
            عدد المنتجات
          </span>

          <strong>
            {capital.length}
          </strong>

        </div>

        <div className="capital-stat-card">

          <span className="stat-title">
            المنتجات الظاهرة
          </span>

          <strong>
            {filteredCapital.length}
          </strong>

        </div>

      </div>

      {/* =====================================
          Search
      ===================================== */}

      <div className="capital-search-box">

        <input
          type="text"
          placeholder="ابحث باسم المنتج أو النوع أو القياس أو اللون..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>

      {/* =====================================
          Loading
      ===================================== */}

      {loading ? (

        <div className="capital-loading">
          جاري تحميل البيانات...
        </div>

      ) : (

        <>
          {/* =====================================
              Desktop Table
          ===================================== */}

          <div className="capital-table-wrapper">

            <table className="capital-table">

              <thead>

                <tr>
                  <th>#</th>
                  <th>اسم المنتج</th>
                  <th>النوع</th>
                  <th>القياس</th>
                  <th>اللون</th>
                  <th>السعر بالدولار</th>
                  <th>السعر بالليرة</th>
                  <th>الكمية</th>
                  <th>الإجراءات</th>
                </tr>

              </thead>

              <tbody>

                {filteredCapital.length === 0 ? (

                  <tr>
                    <td
                      colSpan="9"
                      className="capital-empty-row"
                    >
                      لا توجد منتجات
                    </td>
                  </tr>

                ) : (

                  filteredCapital.map(
                    (item, index) => (

                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td className="capital-product-name">
                          {item.name}
                        </td>

                        <td>
                          {item.type || "-"}
                        </td>

                        <td>
                          {item.size || "-"}
                        </td>

                        <td>
                          {item.color || "-"}
                        </td>

                        <td className="capital-price-usd">
                          $
                          {Number(
                            item.price_usd || 0
                          ).toFixed(2)}
                        </td>

                        <td>
                          {Number(
                            item.price_syp || 0
                          ).toLocaleString()}
                        </td>

                        <td className="capital-quantity">
                          {item.quantity || "-"}
                        </td>

                        <td>

                          <div className="capital-actions">

                            <button
                              type="button"
                              className="capital-edit-btn"
                              onClick={() =>
                                openEditModal(item)
                              }
                            >
                              تعديل
                            </button>

                            <button
                              type="button"
                              className="capital-delete-btn"
                              onClick={() =>
                                handleDelete(item.id)
                              }
                            >
                              حذف
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

          {/* =====================================
              Mobile Cards
          ===================================== */}

          <div className="capital-mobile-list">

            {filteredCapital.length === 0 ? (

              <div className="capital-mobile-empty">
                لا توجد منتجات
              </div>

            ) : (

              filteredCapital.map(
                (item, index) => (

                  <div
                    className="capital-card"
                    key={item.id}
                  >

                    <div className="capital-card-header">

                      <div>

                        <span className="capital-card-number">
                          #{index + 1}
                        </span>

                        <h3>
                          {item.name}
                        </h3>

                      </div>

                    </div>

                    <div className="capital-card-content">

                      <div className="capital-info">

                        <span>
                          النوع
                        </span>

                        <strong>
                          {item.type || "-"}
                        </strong>

                      </div>

                      <div className="capital-info">

                        <span>
                          القياس
                        </span>

                        <strong>
                          {item.size || "-"}
                        </strong>

                      </div>

                      <div className="capital-info">

                        <span>
                          اللون
                        </span>

                        <strong>
                          {item.color || "-"}
                        </strong>

                      </div>

                      <div className="capital-info">

                        <span>
                          السعر بالدولار
                        </span>

                        <strong className="capital-mobile-usd">
                          $
                          {Number(
                            item.price_usd || 0
                          ).toFixed(2)}
                        </strong>

                      </div>

                      <div className="capital-info">

                        <span>
                          السعر بالليرة
                        </span>

                        <strong>
                          {Number(
                            item.price_syp || 0
                          ).toLocaleString()}
                        </strong>

                      </div>

                      <div className="capital-info">

                        <span>
                          الكمية
                        </span>

                        <strong className="capital-mobile-quantity">
                          {item.quantity || "-"}
                        </strong>

                      </div>

                    </div>

                    <div className="capital-card-actions">

                      <button
                        type="button"
                        className="capital-edit-btn"
                        onClick={() =>
                          openEditModal(item)
                        }
                      >
                        تعديل
                      </button>

                      <button
                        type="button"
                        className="capital-delete-btn"
                        onClick={() =>
                          handleDelete(item.id)
                        }
                      >
                        حذف
                      </button>

                    </div>

                  </div>

                )
              )

            )}

          </div>
        </>

      )}

      {/* =====================================
          Modal
      ===================================== */}

      {showModal && (

        <div
          className="capital-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="capital-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* Modal Header */}

            <div className="capital-modal-header">

              <div>

                <h2>
                  {editingId
                    ? "تعديل المنتج"
                    : "إضافة منتج لرأس المال"}
                </h2>

                <p>
                  أدخل بيانات المنتج
                </p>

              </div>

              <button
                type="button"
                className="capital-modal-close"
                onClick={closeModal}
                aria-label="إغلاق"
              >
                ×
              </button>

            </div>

            {/* Form */}

            <form
              className="capital-form"
              onSubmit={handleSubmit}
            >

              {/* اسم المنتج */}

              <div className="capital-form-group">

                <label>
                  اسم المنتج
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="مثال: أكياس شيال"
                />

              </div>

              {/* النوع */}

              <div className="capital-form-group">

                <label>
                  النوع
                </label>

                <input
                  type="text"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  placeholder="مثال: النوع الأول"
                />

              </div>

              {/* القياس */}

              <div className="capital-form-group">

                <label>
                  القياس
                </label>

                <input
                  type="text"
                  name="size"
                  value={form.size}
                  onChange={handleChange}
                  placeholder="مثال: 25-30-35-40"
                />

              </div>

              {/* اللون */}

              <div className="capital-form-group">

                <label>
                  اللون
                </label>

                <input
                  type="text"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  placeholder="مثال: أبيض - أسود"
                />

              </div>

              {/* الأسعار */}

              <div className="capital-form-row">

                <div className="capital-form-group">

                  <label>
                    السعر بالدولار
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price_usd"
                    value={form.price_usd}
                    onChange={handleChange}
                    placeholder="1.90"
                  />

                </div>

                <div className="capital-form-group">

                  <label>
                    السعر بالليرة
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price_syp"
                    value={form.price_syp}
                    onChange={handleChange}
                    placeholder="139"
                  />

                </div>

              </div>

              {/* الكمية */}

              <div className="capital-form-group">

                <label>
                  الكمية
                </label>

                <input
                  type="text"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="مثال: 25-20 أو 40"
                />

                <small>
                  يمكنك إدخال أكثر من كمية باستخدام -
                </small>

              </div>

              {/* Buttons */}

              <div className="capital-form-buttons">

                <button
                  type="button"
                  className="capital-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="capital-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "جاري الحفظ..."
                    : editingId
                    ? "حفظ التعديلات"
                    : "إضافة المنتج"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Capital;