
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Products.css";

function Products() {
  // =====================================================
  // API
  // =====================================================

  const API_URL = "https://abdbac2-11.onrender.com";

  // =====================================================
  // Products
  // =====================================================

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // Sort
  // =====================================================

  const [sortOrder, setSortOrder] = useState("default");

  // =====================================================
  // Exchange Rate
  // =====================================================

  const [exchangeRate, setExchangeRate] = useState("");
  const [savingRate, setSavingRate] = useState(false);
  const [rateMessage, setRateMessage] = useState("");

  // =====================================================
  // Add / Edit
  // =====================================================

  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);

  // =====================================================
  // Form
  // =====================================================

  const emptyForm = {
    name: "",
    type: "",
    size: "",
    color: "",
    price_usd: "",
    quantity: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  // =====================================================
  // User
  // =====================================================

  const user = localStorage.getItem("user");

  // =====================================================
  // GET PRODUCTS
  // =====================================================

  const getProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/products`, {
        timeout: 20000,
      });

      console.log("PRODUCTS:", response.data);

      if (!Array.isArray(response.data)) {
        setProducts([]);
        setError("بيانات المنتجات غير صحيحة");
        return;
      }

      const productsData = response.data;

      setProducts(productsData);

      // =================================================
      // جلب سعر الصرف
      // =================================================

      const productWithRate = productsData.find(
        (product) =>
          product.price_syp !== undefined &&
          product.price_syp !== null &&
          product.price_syp !== "" &&
          Number(product.price_syp) > 0
      );

      if (productWithRate) {
        setExchangeRate(Number(productWithRate.price_syp));
      } else {
        setExchangeRate("");
      }
    } catch (error) {
      console.log("GET PRODUCTS ERROR:", error);

      if (error.response) {
        setError(
          `حدث خطأ أثناء جلب المنتجات (${error.response.status})`
        );
      } else if (error.code === "ECONNABORTED") {
        setError("السيرفر تأخر بالاستجابة");
      } else {
        setError("تعذر الاتصال بالسيرفر");
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FIRST LOAD
  // =====================================================

  useEffect(() => {
    getProducts();
  }, []);

  // =====================================================
  // SORT
  // =====================================================

  const sortedProducts = [...products].sort((a, b) => {
    const nameA = String(a.name || "").trim();
    const nameB = String(b.name || "").trim();

    if (sortOrder === "asc") {
      return nameA.localeCompare(nameB, "ar");
    }

    if (sortOrder === "desc") {
      return nameB.localeCompare(nameA, "ar");
    }

    return 0;
  });

  // =====================================================
  // EXCHANGE RATE INPUT
  // =====================================================

  const handleExchangeRateChange = (e) => {
    setExchangeRate(e.target.value);
    setRateMessage("");
  };

  // =====================================================
  // SAVE EXCHANGE RATE
  // =====================================================

  const saveExchangeRate = async () => {
    if (
      exchangeRate === "" ||
      exchangeRate === null ||
      Number(exchangeRate) <= 0
    ) {
      setRateMessage("يرجى إدخال سعر صرف صحيح");
      return;
    }

    if (products.length === 0) {
      setRateMessage("لا يوجد منتجات في قاعدة البيانات");
      return;
    }

    try {
      setSavingRate(true);
      setRateMessage("");

      const rate = Number(exchangeRate);

      const rateProduct =
        products.find(
          (product) =>
            product.price_syp !== undefined &&
            product.price_syp !== null &&
            product.price_syp !== ""
        ) || products[0];

      console.log("Saving exchange rate...");
      console.log("Product ID:", rateProduct.id);
      console.log("Rate:", rate);

      const response = await axios.patch(
        `${API_URL}/products/${rateProduct.id}`,
        {
          price_syp: rate,
        },
        {
          timeout: 20000,
        }
      );

      console.log("DATABASE RESPONSE:", response.data);

      setExchangeRate(rate);

      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          String(product.id) === String(rateProduct.id)
            ? {
                ...product,
                price_syp: rate,
              }
            : product
        )
      );

      setRateMessage(
        "تم حفظ سعر الصرف في قاعدة البيانات بنجاح ✓"
      );
    } catch (error) {
      console.log("SAVE EXCHANGE RATE ERROR:", error);

      if (error.code === "ECONNABORTED") {
        setRateMessage("السيرفر تأخر بالاستجابة ❌");
      } else if (error.response) {
        setRateMessage(
          `فشل الحفظ ❌ (${error.response.status})`
        );
      } else {
        setRateMessage("تعذر الاتصال بالسيرفر ❌");
      }
    } finally {
      setSavingRate(false);
    }
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ===================================================
    // القياس
    // يسمح بالأرقام والضرب × والشرطة -
    //
    // أمثلة:
    // 25
    // 25-30
    // 25-30-35
    // 10×20-12×20-15×20
    // ===================================================

    if (name === "size") {
      const cleanedValue = value.replace(/[^\d×xX*-]/g, "");

      setFormData((prev) => ({
        ...prev,
        size: cleanedValue,
      }));

      return;
    }

    // ===================================================
    // الكمية
    // يسمح بالأرقام والشرطة -
    //
    // أمثلة:
    // 10
    // 10-20
    // 25-30
    // 100-150
    // ===================================================

    if (name === "quantity") {
      const cleanedValue = value.replace(/[^\d-]/g, "");

      setFormData((prev) => ({
        ...prev,
        quantity: cleanedValue,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // OPEN ADD FORM
  // =====================================================

  const openAddForm = () => {
    setFormData(emptyForm);
    setEditId(null);
    setShowAddForm(true);
  };

  // =====================================================
  // CLOSE FORM
  // =====================================================

  const closeForm = () => {
    setShowAddForm(false);
    setEditId(null);
    setFormData(emptyForm);
  };

  // =====================================================
  // ADD PRODUCT
  // =====================================================

  const handleAdd = async (e) => {
    e.preventDefault();

    try {
      const newProduct = {
        name: formData.name,
        type: formData.type,
        size: formData.size,
        color: formData.color,

        price_usd: Number(formData.price_usd),

        // سعر الصرف الحالي
        price_syp: Number(exchangeRate || 0),

        // الكمية تبقى نص حتى تقبل -
        quantity: formData.quantity,
      };

      console.log("NEW PRODUCT:", newProduct);

      const response = await axios.post(
        `${API_URL}/products`,
        newProduct,
        {
          timeout: 20000,
        }
      );

      console.log("ADD RESPONSE:", response.data);

      setProducts((prev) => [
        ...prev,
        response.data,
      ]);

      closeForm();

      alert("تمت إضافة المنتج بنجاح ✓");
    } catch (error) {
      console.log("ADD PRODUCT ERROR:", error);

      alert("حدث خطأ أثناء إضافة المنتج ❌");
    }
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "هل أنت متأكد من حذف هذا المنتج؟"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/products/${id}`,
        {
          timeout: 20000,
        }
      );

      setProducts((prevProducts) =>
        prevProducts.filter(
          (product) =>
            String(product.id) !== String(id)
        )
      );

      alert("تم حذف المنتج بنجاح ✓");
    } catch (error) {
      console.log(
        "DELETE PRODUCT ERROR:",
        error
      );

      alert(
        "حدث خطأ أثناء حذف المنتج ❌"
      );
    }
  };

  // =====================================================
  // EDIT PRODUCT
  // =====================================================

  const handleEdit = (product) => {
    setEditId(product.id);

    setFormData({
      name: product.name || "",
      type: product.type || "",
      size:
        product.size !== undefined &&
        product.size !== null
          ? String(product.size)
          : "",
      color: product.color || "",
      price_usd: product.price_usd ?? "",

      // الكمية تبقى كما هي
      quantity:
        product.quantity !== undefined &&
        product.quantity !== null
          ? String(product.quantity)
          : "",
    });

    setShowAddForm(true);
  };

  // =====================================================
  // UPDATE PRODUCT
  // =====================================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const updatedProduct = {
        name: formData.name,
        type: formData.type,
        size: formData.size,
        color: formData.color,

        price_usd: Number(formData.price_usd),

        // الحفاظ على سعر الصرف
        price_syp: Number(exchangeRate || 0),

        // الكمية تبقى نص حتى تقبل -
        quantity: formData.quantity,
      };

      console.log(
        "UPDATED PRODUCT:",
        updatedProduct
      );

      const response = await axios.put(
        `${API_URL}/products/${editId}`,
        updatedProduct,
        {
          timeout: 20000,
        }
      );

      console.log(
        "UPDATE RESPONSE:",
        response.data
      );

      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          String(product.id) === String(editId)
            ? response.data
            : product
        )
      );

      closeForm();

      alert("تم تعديل المنتج بنجاح ✓");
    } catch (error) {
      console.log(
        "UPDATE PRODUCT ERROR:",
        error
      );

      alert(
        "حدث خطأ أثناء تعديل المنتج ❌"
      );
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="loading">
        جاري تحميل المنتجات...
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="store-page">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="store-navbar">

        <div className="store-logo">
          متجري
        </div>

        <div className="store-links">

          <Link to="/products">
            المنتجات
          </Link>

          <Link to="/checks">
            الشيكات
          </Link>

          <a
            href="https://wa.me/963967227179"
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-link"
          >
            💬 تواصل معنا
          </a>

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

      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="store-content">

        {/* =================================================
            TITLE
        ================================================= */}

        <div className="store-title">

          <h1>
            منتجاتنا
          </h1>

          <p>
            تصفح جميع المنتجات المتوفرة لدينا
          </p>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="products-error">
            {error}
          </div>
        )}

        {/* =================================================
            EXCHANGE RATE
        ================================================= */}

        <div className="exchange-rate-box">

          <div className="exchange-rate-content">

            <span className="exchange-rate-label">
              💵 سعر صرف الدولار
            </span>

            {user ? (

              <div className="exchange-rate-edit">

                <input
                  type="number"
                  min="1"
                  value={exchangeRate}
                  onChange={
                    handleExchangeRateChange
                  }
                  placeholder="أدخل سعر الصرف"
                />

                <span>
                  ل.س
                </span>

                <button
                  type="button"
                  className="save-rate-btn"
                  onClick={
                    saveExchangeRate
                  }
                  disabled={savingRate}
                >
                  {savingRate
                    ? "جاري الحفظ..."
                    : "حفظ"}
                </button>

                {rateMessage && (
                  <div
                    className={
                      rateMessage.includes(
                        "بنجاح"
                      )
                        ? "rate-success"
                        : "rate-error"
                    }
                  >
                    {rateMessage}
                  </div>
                )}

              </div>

            ) : (

              <div className="exchange-rate-value">

                {exchangeRate
                  ? Number(
                      exchangeRate
                    ).toLocaleString(
                      "en-US"
                    )
                  : "غير محدد"}

                <span>
                  ل.س
                </span>

              </div>

            )}

          </div>

        </div>

        {/* =================================================
            ADD PRODUCT
        ================================================= */}

        {user && (
          <button
            className="add-product-btn"
            onClick={openAddForm}
          >
            + إضافة منتج
          </button>
        )}

        {/* =================================================
            SORT
        ================================================= */}

        <div className="products-sort">

          <label htmlFor="sortProducts">
            ترتيب المنتجات:
          </label>

          <select
            id="sortProducts"
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(
                e.target.value
              )
            }
          >

            <option value="default">
              الترتيب الافتراضي
            </option>

            <option value="asc">
              أبجدياً من أ → ي
            </option>

            <option value="desc">
              أبجدياً من ي → أ
            </option>

          </select>

        </div>

        {/* =================================================
            PRODUCTS TABLE
        ================================================= */}

        <div className="products-table-container">

          <table className="products-table">

            <thead>

              <tr>

                <th>
                  الاسم
                </th>

                <th>
                  النوع
                </th>

                <th>
                  القياس
                </th>

                <th>
                  اللون
                </th>

                <th>
                  السعر بالدولار
                </th>

                <th>
                  الكمية
                </th>

                {user && (
                  <th>
                    الإجراءات
                  </th>
                )}

              </tr>

            </thead>

            <tbody>

              {sortedProducts.map(
                (product) => (

                  <tr
                    key={product.id}
                  >

                    <td>
                      {product.name}
                    </td>

                    <td>
                      {product.type}
                    </td>

                    <td>
                      {product.size}
                    </td>

                    <td>
                      {product.color}
                    </td>

                    <td className="price-cell">
                      $
                      {product.price_usd}
                    </td>

                    <td>
                      {product.quantity}
                    </td>

                    {user && (

                      <td>

                        <div className="table-actions">

                          <button
                            className="edit-btn"
                            onClick={() =>
                              handleEdit(
                                product
                              )
                            }
                          >
                            تعديل
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() =>
                              handleDelete(
                                product.id
                              )
                            }
                          >
                            حذف
                          </button>

                        </div>

                      </td>

                    )}

                  </tr>

                )
              )}

              {sortedProducts.length === 0 && (

                <tr>

                  <td
                    colSpan={
                      user ? 7 : 6
                    }
                    className="empty-products"
                  >
                    لا يوجد منتجات
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </main>

      {/* =================================================
          ADD / EDIT PRODUCT MODAL
      ================================================= */}

      {(showAddForm || editId !== null) &&
        user && (

          <div className="modal-overlay">

            <div className="modal">

              {/* CLOSE */}

              <button
                type="button"
                className="close-modal"
                onClick={closeForm}
              >
                ×
              </button>

              {/* TITLE */}

              <h2>
                {editId !== null
                  ? "تعديل المنتج"
                  : "إضافة منتج"}
              </h2>

              {/* FORM */}

              <form
                onSubmit={
                  editId !== null
                    ? handleUpdate
                    : handleAdd
                }
              >

                <input
                  type="text"
                  name="name"
                  placeholder="اسم المنتج"
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

                <input
                  type="text"
                  name="type"
                  placeholder="النوع"
                  value={
                    formData.type
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

                {/* =================================================
                    SIZE
                    يسمح بأكثر من قياس باستخدام -
                ================================================= */}

                <input
                  type="text"
                  name="size"
                  placeholder="القياس مثال: 25-30-35"
                  value={
                    formData.size
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

                <small className="input-hint">
                  يمكنك إدخال أكثر من قياس باستخدام -
                  مثل: 25-30-35 أو 10×20-12×20
                </small>

                <input
                  type="text"
                  name="color"
                  placeholder="اللون"
                  value={
                    formData.color
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price_usd"
                  placeholder="السعر بالدولار"
                  value={
                    formData.price_usd
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

                {/* =================================================
                    QUANTITY
                    يسمح بالأرقام والشرطة -
                ================================================= */}

                <input
                  type="text"
                  inputMode="text"
                  name="quantity"
                  placeholder="الكمية مثال: 10-20"
                  value={
                    formData.quantity
                  }
                  onChange={
                    handleChange
                  }
                />

                <button
                  type="submit"
                  className="save-btn"
                >
                  {editId !== null
                    ? "حفظ التعديل"
                    : "إضافة المنتج"}
                </button>

              </form>

            </div>

          </div>

        )}

    </div>
  );
}

export default Products;

