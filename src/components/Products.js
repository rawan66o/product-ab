import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Products.css";
function Products() {

  // =================================
  // Products
  // =================================

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // =================================
  // Modal
  // =================================

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [editId, setEditId] =
    useState(null);


  // =================================
  // Form
  // =================================

  const emptyForm = {

    name: "",

    type: "",

    size: "",

    color: "",

    price_usd: "",

    price_syp: "",

    quantity: "",

  };


  const [formData, setFormData] =
    useState(emptyForm);


  // =================================
  // User
  // =================================

  const user = localStorage.getItem("user");


  // =================================
  // GET
  // =================================

  const getProducts = async () => {

    try {

      setLoading(true);


      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/products`
      );


      setProducts(response.data);

      setError("");


    } catch (error) {

      console.log(error);

      setError(
        "حدث خطأ أثناء جلب المنتجات"
      );


    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    getProducts();

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
  // POST
  // =================================

  const handleAdd = async (e) => {

    e.preventDefault();


    try {

      const newProduct = {

        name: formData.name,

        type: formData.type,

        size: formData.size,

        color: formData.color,

        price_usd:
          Number(formData.price_usd),

        price_syp:
          Number(formData.price_syp || 0),

        quantity:
          Number(formData.quantity || 0),

      };


      await axios.post(
        `${process.env.REACT_APP_API_URL}/products`,
        newProduct
      );


      setShowAddForm(false);

      setFormData(emptyForm);


      getProducts();


    } catch (error) {

      console.log(error);

      alert(
        "حدث خطأ أثناء إضافة المنتج"
      );

    }

  };


  // =================================
  // DELETE
  // =================================

  const handleDelete = async (id) => {

    const confirmDelete =
      window.confirm(
        "هل أنت متأكد من حذف هذا المنتج؟"
      );


    if (!confirmDelete) {
      return;
    }


    try {

      await axios.delete(
        `${process.env.REACT_APP_API_URL}/products/${id}`
      );


      setProducts(
        products.filter(
          (product) =>
            product.id !== id
        )
      );


    } catch (error) {

      console.log(error);

      alert(
        "حدث خطأ أثناء حذف المنتج"
      );

    }

  };


  // =================================
  // Open Edit
  // =================================

  const handleEdit = (product) => {

    setEditId(product.id);


    setFormData({

      name: product.name || "",

      type: product.type || "",

      size: product.size || "",

      color: product.color || "",

      price_usd:
        product.price_usd ?? "",

      price_syp:
        product.price_syp ?? "",

      quantity:
        product.quantity ?? "",

    });

  };


  // =================================
  // PUT
  // =================================

  const handleUpdate = async (e) => {

    e.preventDefault();


    try {

      const updatedProduct = {

        name: formData.name,

        type: formData.type,

        size: formData.size,

        color: formData.color,

        price_usd:
          Number(formData.price_usd),

        price_syp:
          Number(formData.price_syp || 0),

        quantity:
          Number(formData.quantity || 0),

      };


      await axios.put(
        `${process.env.REACT_APP_API_URL}/products/${editId}`,
        updatedProduct
      );


      setEditId(null);

      setFormData(emptyForm);


      getProducts();


    } catch (error) {

      console.log(error);

      alert(
        "حدث خطأ أثناء تعديل المنتج"
      );

    }

  };


  // =================================
  // Loading
  // =================================

  if (loading) {

    return (

      <div className="loading">

        جاري تحميل المنتجات...

      </div>

    );

  }


  // =================================
  // Return
  // =================================

  return (

    <div className="store-page">


      {/* =================================
          Navbar
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
          Content
      ================================= */}

      <main className="store-content">


        <div className="store-title">

          <h1>
            منتجاتنا
          </h1>

          <p>
            تصفح جميع المنتجات المتوفرة لدينا
          </p>

        </div>


        {/* Error */}

        {error && (

          <div className="products-error">
            {error}
          </div>

        )}


        {/* =================================
            Add
        ================================= */}

        {user && (

          <button
            className="add-product-btn"
            onClick={() => {

              setFormData(emptyForm);

              setShowAddForm(true);

            }}
          >
            + إضافة منتج
          </button>

        )}


        {/* =================================
            Table
        ================================= */}

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
              سعر صرف الدولار  
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

              {products.map((product) => (

                <tr key={product.id}>


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
                    ${product.price_usd}
                  </td>


                  <td>
                    {product.price_syp}
                  </td>


                  <td>
                    {product.quantity}
                  </td>


                  {/* Actions للأدمن */}

                  {user && (

                    <td>

                      <div className="table-actions">


                        <button
                          className="edit-btn"
                          onClick={() =>
                            handleEdit(product)
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

              ))}


              {products.length === 0 && (

                <tr>

                  <td
                    colSpan={user ? 8 : 7}
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


      {/* =================================
          ADD MODAL
      ================================= */}

      {showAddForm && user && (

        <div className="modal-overlay">

          <div className="modal">


            <button
              className="close-modal"
              onClick={() =>
                setShowAddForm(false)
              }
            >
              ×
            </button>


            <h2>
              إضافة منتج
            </h2>


            <form onSubmit={handleAdd}>


              <input
                type="text"
                name="name"
                placeholder="اسم المنتج"
                value={formData.name}
                onChange={handleChange}
                required
              />


              <input
                type="text"
                name="type"
                placeholder="النوع"
                value={formData.type}
                onChange={handleChange}
                required
              />


              <input
                type="text"
                name="size"
                placeholder="القياس"
                value={formData.size}
                onChange={handleChange}
                required
              />


              <input
                type="text"
                name="color"
                placeholder="اللون"
                value={formData.color}
                onChange={handleChange}
                required
              />


              <input
                type="number"
                step="0.01"
                name="price_usd"
                placeholder="السعر بالدولار"
                value={formData.price_usd}
                onChange={handleChange}
                required
              />


              <input
                type="number"
                name="price_syp"
                placeholder="سعر صرف الدولار   
                 "
                value={formData.price_syp}
                onChange={handleChange}
              />


              <input
                type="number"
                name="quantity"
                placeholder="الكمية"
                value={formData.quantity}
                onChange={handleChange}
              />


              <button
                type="submit"
                className="save-btn"
              >
                إضافة المنتج
              </button>


            </form>


          </div>

        </div>

      )}


      {/* =================================
          EDIT MODAL
      ================================= */}

      {editId !== null && user && (

        <div className="modal-overlay">

          <div className="modal">


            <button
              className="close-modal"
              onClick={() =>
                setEditId(null)
              }
            >
              ×
            </button>


            <h2>
              تعديل المنتج
            </h2>


            <form onSubmit={handleUpdate}>


              <input
                type="text"
                name="name"
                placeholder="اسم المنتج"
                value={formData.name}
                onChange={handleChange}
                required
              />


              <input
                type="text"
                name="type"
                placeholder="النوع"
                value={formData.type}
                onChange={handleChange}
                required
              />


              <input
                type="text"
                name="size"
                placeholder="القياس"
                value={formData.size}
                onChange={handleChange}
                required
              />


              <input
                type="text"
                name="color"
                placeholder="اللون"
                value={formData.color}
                onChange={handleChange}
                required
              />


              <input
                type="number"
                step="0.01"
                name="price_usd"
                placeholder="السعر بالدولار"
                value={formData.price_usd}
                onChange={handleChange}
                required
              />


              <input
                type="number"
                name="price_syp"
                placeholder="سعر صرف الدولار "
                value={formData.price_syp}
                onChange={handleChange}
              />


              <input
                type="number"
                name="quantity"
                placeholder="الكمية"
                value={formData.quantity}
                onChange={handleChange}
              />


              <button
                type="submit"
                className="save-btn"
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

export default Products;