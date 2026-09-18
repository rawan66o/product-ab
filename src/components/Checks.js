import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Checks.css";

const API_URL = "https://abdbac2-10.onrender.com/checks";

// =====================================================
// عنصر بضاعة فارغ
// =====================================================

const emptyItem = {
  productType: "",
  specifications: "",
  quantity: "",
  priceUsd: "",
  priceSyp: "",
};

// =====================================================
// فورم الكشف الفارغ
// =====================================================

const emptyForm = {
  customerName: "",
  residence: "",
  date: "",
  checkNumber: "",
  bookNumber: "",
  exchangeRate: "",
  type: "شراء",
  notes: "",
  items: [{ ...emptyItem }],
};

// =====================================================
// تنسيق الأرقام
// =====================================================

const formatNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const cleanValue = String(value).replace(/,/g, "");

  if (!/^\d*\.?\d*$/.test(cleanValue)) {
    return String(value);
  }

  const parts = cleanValue.split(".");
  const integerPart = parts[0] || "0";
  const decimalPart = parts[1];

  const formattedInteger =
    Number(integerPart).toLocaleString("en-US");

  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  }

  return formattedInteger;
};

// =====================================================
// إزالة الفواصل
// =====================================================

const removeCommas = (value) => {
  return String(value || "").replace(/,/g, "");
};

// =====================================================
// تحويل إلى رقم
// =====================================================

const toNumber = (value) => {
  const cleaned = removeCommas(value);

  if (cleaned === "") {
    return 0;
  }

  return Number(cleaned);
};

// =====================================================
// حساب الإجمالي بالدولار
// =====================================================

const calculateTotalUsd = (items) => {
  return items.reduce((total, item) => {
    const quantity = toNumber(item.quantity);
    const priceUsd = toNumber(item.priceUsd);

    return total + quantity * priceUsd;
  }, 0);
};

// =====================================================
// حساب الإجمالي بالسوري
// =====================================================

const calculateTotalSyp = (items) => {
  return items.reduce((total, item) => {
    const quantity = toNumber(item.quantity);
    const priceSyp = toNumber(item.priceSyp);

    return total + quantity * priceSyp;
  }, 0);
};

// =====================================================
// تحويل البيانات القديمة إلى الشكل الجديد
// =====================================================

const normalizeCheck = (check) => {
  if (!check) {
    return check;
  }

  // إذا كان الكشف جديد
  if (Array.isArray(check.items)) {
    return {
      ...check,

      customerName:
        check.customerName ||
        check.recipientName ||
        "",

      residence:
        check.residence || "",

      checkNumber:
        check.checkNumber || "",

      bookNumber:
        check.bookNumber || "",

      // سعر الدولار وقت إنشاء الكشف
      exchangeRate:
        check.exchangeRate ??
        check.dollarRate ??
        check.usdRate ??
        "",

      items: check.items.map((item) => ({
        productType:
          item.productType || "",

        specifications:
          item.specifications || "",

        quantity:
          item.quantity ?? "",

        priceUsd:
          item.priceUsd ??
          item.price ??
          "",

        priceSyp:
          item.priceSyp ?? "",
      })),
    };
  }

  // تحويل الكشف القديم
  return {
    ...check,

    customerName:
      check.customerName ||
      check.recipientName ||
      "",

    residence:
      check.residence || "",

    checkNumber:
      check.checkNumber || "",

    bookNumber:
      check.bookNumber || "",

    exchangeRate:
      check.exchangeRate ??
      check.dollarRate ??
      check.usdRate ??
      "",

    items: [
      {
        productType:
          check.productType || "",

        specifications:
          check.specifications || "",

        quantity:
          check.quantity ?? "",

        priceUsd:
          check.price ??
          "",

        priceSyp:
          check.priceSyp ??
          "",
      },
    ],
  };
};

// =====================================================
// فورم الكشف
// =====================================================

function CheckForm({
  formData,
  handleChange,
  handleItemChange,
  addItem,
  removeItem,
  handleSubmit,
  closeForm,
  editMode,
  selectedCustomer,
}) {
  const totalUsd = calculateTotalUsd(
    formData.items
  );

  const totalSyp = calculateTotalSyp(
    formData.items
  );

  return (
    <div className="modal-overlay">

      <div className="modal check-form-modal">

        {/* Header */}
        <div className="modal-header">

          <div>

            <h2>
              {editMode
                ? "تعديل الكشف"
                : selectedCustomer
                ? `كشف جديد لـ ${selectedCustomer}`
                : "إضافة كشف جديد"}
            </h2>

            {!editMode &&
              selectedCustomer && (
                <small>
                  يمكنك إنشاء كشف جديد لنفس الزبون
                </small>
              )}

          </div>

          <button
            type="button"
            className="close-modal"
            onClick={closeForm}
          >
            ×
          </button>

        </div>

        {/* Form */}
        <form
          className="check-form"
          onSubmit={handleSubmit}
        >

          {/* =============================== */}
          {/* بيانات الزبون */}
          {/* =============================== */}

          <div className="form-section-title">
            بيانات الزبون
          </div>

          <div className="form-group">

            <label>
              اسم الزبون
            </label>

            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="أدخل اسم الزبون"
              required
              disabled={
                !!selectedCustomer &&
                !editMode
              }
            />

          </div>

          <div className="form-group">

            <label>
              مكان الإقامة
            </label>

            <input
              type="text"
              name="residence"
              value={formData.residence}
              onChange={handleChange}
              placeholder="مثال: حلب - الحمدانية"
              required
            />

          </div>

          {/* =============================== */}
          {/* بيانات الكشف */}
          {/* =============================== */}

          <div className="form-section-title">
            بيانات الكشف
          </div>

          <div className="form-group">

            <label>
              رقم الكشف
            </label>

            <input
              type="text"
              name="checkNumber"
              value={formData.checkNumber}
              onChange={handleChange}
              placeholder="أدخل رقم الكشف"
              required
            />

          </div>

          {/* رقم الدفتر */}

          <div className="form-group">

            <label>
              رقم الدفتر
            </label>

            <input
              type="text"
              name="bookNumber"
              value={formData.bookNumber}
              onChange={handleChange}
              placeholder="أدخل رقم الدفتر"
              required
            />

          </div>

          {/* التاريخ */}

          <div className="form-group">

            <label>
              التاريخ
            </label>

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />

          </div>

          {/* نوع الكشف */}

          <div className="form-group">

            <label>
              نوع الكشف
            </label>

            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
            >

              <option value="شراء">
                شراء
              </option>

              <option value="بيع">
                بيع
              </option>

            </select>

          </div>

          {/* =============================== */}
          {/* سعر الدولار */}
          {/* =============================== */}

          <div className="form-group exchange-rate-group">

            <label>
              سعر الدولار وقت إنشاء الكشف
            </label>

            <input
              type="text"
              inputMode="decimal"
              name="exchangeRate"
              value={formData.exchangeRate}
              onChange={handleChange}
              placeholder="مثال: 13,333"
              required
            />

            <small>
              يتم حفظ سعر الدولار مع هذا الكشف
            </small>

          </div>

          {/* =============================== */}
          {/* المواد */}
          {/* =============================== */}

          <div className="form-section-title items-title">

            <span>
              مواد الكشف
            </span>

            <button
              type="button"
              className="add-item-btn"
              onClick={addItem}
            >
              + إضافة مادة
            </button>

          </div>

          <div className="items-container">

            {formData.items.map(
              (item, index) => (

                <div
                  className="item-box"
                  key={index}
                >

                  <div className="item-box-header">

                    <strong>
                      المادة {index + 1}
                    </strong>

                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() =>
                          removeItem(index)
                        }
                      >
                        حذف المادة
                      </button>
                    )}

                  </div>

                  <div className="item-grid">

                    {/* نوع البضاعة */}

                    <div className="form-group">

                      <label>
                        نوع البضاعة
                      </label>

                      <input
                        type="text"
                        value={
                          item.productType
                        }
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "productType",
                            e.target.value
                          )
                        }
                        placeholder="مثال: أكياس شيال"
                        required
                      />

                    </div>

                    {/* المواصفات */}

                    <div className="form-group">

                      <label>
                        المواصفات
                      </label>

                      <input
                        type="text"
                        value={
                          item.specifications
                        }
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "specifications",
                            e.target.value
                          )
                        }
                        placeholder="النوع - القياس - اللون"
                      />

                    </div>

                    {/* العدد */}

                    <div className="form-group">

                      <label>
                        العدد
                      </label>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          item.quantity
                        }
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            e.target.value
                          )
                        }
                        placeholder="مثال: 1,000"
                        required
                      />

                    </div>

                    {/* السعر بالدولار */}

                    <div className="form-group">

                      <label>
                        السعر بالدولار
                      </label>

                      <input
                        type="text"
                        inputMode="decimal"
                        value={
                          item.priceUsd
                        }
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "priceUsd",
                            e.target.value
                          )
                        }
                        placeholder="مثال: 1.7"
                        required
                      />

                    </div>

                    {/* السعر بالسوري */}

                    <div className="form-group">

                      <label>
                        السعر بالسوري
                      </label>

                      <input
                        type="text"
                        inputMode="decimal"
                        value={
                          item.priceSyp
                        }
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "priceSyp",
                            e.target.value
                          )
                        }
                        placeholder="مثال: 13,333"
                        required
                      />

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

          {/* =============================== */}
          {/* الإجماليات */}
          {/* =============================== */}

          <div className="total-preview">

            <div>

              <span>
                القيمة الإجمالية بالدولار
              </span>

              <strong>
                $
                {" "}
                {formatNumber(
                  totalUsd.toFixed(2)
                )}
              </strong>

            </div>

            <div>

              <span>
                القيمة الإجمالية بالسوري
              </span>

              <strong>
                {formatNumber(
                  totalSyp.toFixed(0)
                )}
                {" "}
                ل.س
              </strong>

            </div>

          </div>

          {/* =============================== */}
          {/* الملاحظات */}
          {/* =============================== */}

          <div className="form-section-title">
            ملاحظات
          </div>

          <div className="form-group full-width">

            <label>
              الملاحظات
            </label>

            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="أدخل الملاحظات..."
            />

          </div>

          {/* =============================== */}
          {/* الأزرار */}
          {/* =============================== */}

          <div className="form-actions">

            <button
              type="submit"
              className="btn btn-save"
            >
              {editMode
                ? "حفظ التعديل"
                : "إضافة الكشف"}
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

// =====================================================
// الصفحة الرئيسية
// =====================================================

function Checks() {

  const [checks, setChecks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [filterType, setFilterType] =
    useState("all");

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [editId, setEditId] =
    useState(null);

  const [formData, setFormData] =
    useState(emptyForm);

  const [selectedCustomer, setSelectedCustomer] =
    useState("");

  const [openedCheck, setOpenedCheck] =
    useState(null);

  // =====================================================
  // جلب الكشوف
  // =====================================================

  const getChecks = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await axios.get(API_URL);

      if (Array.isArray(response.data)) {

        const normalized =
          response.data.map(
            normalizeCheck
          );

        setChecks(normalized);

      } else {

        setChecks([]);

      }

    } catch (err) {

      console.error(err);

      setError(
        "حدث خطأ أثناء جلب الكشوف"
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    getChecks();
  }, []);

  // =====================================================
  // تغيير بيانات الفورم
  // =====================================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    // تنسيق سعر الدولار
    if (name === "exchangeRate") {

      let cleanValue =
        value.replace(/[^\d.]/g, "");

      const parts =
        cleanValue.split(".");

      if (parts.length > 2) {

        cleanValue =
          parts[0] +
          "." +
          parts.slice(1).join("");

      }

      cleanValue =
        formatNumber(cleanValue);

      setFormData((prev) => ({
        ...prev,
        exchangeRate:
          cleanValue,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // تغيير مادة
  // =====================================================

  const handleItemChange = (
    index,
    field,
    value
  ) => {

    const numberFields = [
      "quantity",
      "priceUsd",
      "priceSyp",
    ];

    if (
      numberFields.includes(field)
    ) {

      let cleanValue =
        value.replace(/[^\d.]/g, "");

      const parts =
        cleanValue.split(".");

      if (parts.length > 2) {

        cleanValue =
          parts[0] +
          "." +
          parts
            .slice(1)
            .join("");

      }

      cleanValue =
        formatNumber(cleanValue);

      setFormData((prev) => {

        const newItems =
          [...prev.items];

        newItems[index] = {
          ...newItems[index],
          [field]: cleanValue,
        };

        return {
          ...prev,
          items: newItems,
        };
      });

      return;
    }

    setFormData((prev) => {

      const newItems =
        [...prev.items];

      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };

      return {
        ...prev,
        items: newItems,
      };
    });
  };

  // =====================================================
  // إضافة مادة
  // =====================================================

  const addItem = () => {

    setFormData((prev) => ({
      ...prev,

      items: [
        ...prev.items,
        { ...emptyItem },
      ],
    }));
  };

  // =====================================================
  // حذف مادة
  // =====================================================

  const removeItem = (index) => {

    setFormData((prev) => ({
      ...prev,

      items: prev.items.filter(
        (_, i) => i !== index
      ),
    }));
  };

  // =====================================================
  // فتح فورم الإضافة
  // =====================================================

  const openAddForm = (
    customerName = "",
    residence = ""
  ) => {

    setSelectedCustomer(
      customerName
    );

    setFormData({
      ...emptyForm,

      customerName:
        customerName,

      residence:
        residence,

      date:
        new Date()
          .toISOString()
          .split("T")[0],
    });

    setEditId(null);

    setShowAddForm(true);
  };

  // =====================================================
  // إغلاق الفورم
  // =====================================================

  const closeForm = () => {

    setShowAddForm(false);

    setEditId(null);

    setSelectedCustomer("");

    setFormData({
      ...emptyForm,
      items: [{ ...emptyItem }],
    });
  };

  // =====================================================
  // توليد ID
  // =====================================================

  const generateId = () => {

    const numericIds =
      checks
        .map((check) =>
          Number(check.id)
        )
        .filter(
          (id) => !isNaN(id)
        );

    if (numericIds.length > 0) {

      return String(
        Math.max(...numericIds) + 1
      );
    }

    return String(
      Date.now()
    );
  };

  // =====================================================
  // إضافة كشف
  // =====================================================

  const handleAdd = async (e) => {

    e.preventDefault();

    try {

      const totalAmountUsd =
        calculateTotalUsd(
          formData.items
        );

      const totalAmountSyp =
        calculateTotalSyp(
          formData.items
        );

      const newCheck = {

        id: generateId(),

        customerName:
          formData.customerName.trim(),

        residence:
          formData.residence.trim(),

        date:
          formData.date,

        checkNumber:
          formData.checkNumber.trim(),

        bookNumber:
          formData.bookNumber.trim(),

        // ==========================================
        // سعر الدولار وقت إنشاء الكشف
        // ==========================================

        exchangeRate:
          toNumber(
            formData.exchangeRate
          ),

        type:
          formData.type,

        totalAmountUsd:
          Number(
            totalAmountUsd.toFixed(2)
          ),

        totalAmountSyp:
          Number(
            totalAmountSyp.toFixed(0)
          ),

        items:
          formData.items.map(
            (item) => ({

              productType:
                item.productType.trim(),

              specifications:
                item.specifications.trim(),

              quantity:
                toNumber(
                  item.quantity
                ),

              priceUsd:
                toNumber(
                  item.priceUsd
                ),

              priceSyp:
                toNumber(
                  item.priceSyp
                ),

            })
          ),

        notes:
          formData.notes.trim(),
      };

      console.log(
        "البيانات المرسلة:",
        newCheck
      );

      const response =
        await axios.post(
          API_URL,
          newCheck
        );

      setChecks((prev) => [
        ...prev,
        normalizeCheck(
          response.data
        ),
      ]);

      closeForm();

      alert(
        "تمت إضافة الكشف بنجاح"
      );

    } catch (err) {

      console.error(err);

      alert(
        "حدث خطأ أثناء إضافة الكشف"
      );
    }
  };

  // =====================================================
  // حذف كشف
  // =====================================================

  const handleDelete = async (
    id
  ) => {

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

      if (
        openedCheck &&
        String(openedCheck.id) ===
          String(id)
      ) {

        setOpenedCheck(null);

      }

      alert(
        "تم حذف الكشف بنجاح"
      );

    } catch (err) {

      console.error(err);

      alert(
        "حدث خطأ أثناء حذف الكشف"
      );
    }
  };

  // =====================================================
  // فتح التعديل
  // =====================================================

  const handleEdit = (check) => {

    const normalized =
      normalizeCheck(check);

    setEditId(
      check.id
    );

    setSelectedCustomer(
      normalized.customerName || ""
    );

    setFormData({

      customerName:
        normalized.customerName || "",

      residence:
        normalized.residence || "",

      date:
        normalized.date || "",

      checkNumber:
        normalized.checkNumber || "",

      bookNumber:
        normalized.bookNumber || "",

      // سعر الدولار المحفوظ
      exchangeRate:
        normalized.exchangeRate !== ""
          ? formatNumber(
              normalized.exchangeRate
            )
          : "",

      type:
        normalized.type || "شراء",

      notes:
        normalized.notes || "",

      items:
        normalized.items &&
        normalized.items.length
          ? normalized.items.map(
              (item) => ({

                productType:
                  item.productType || "",

                specifications:
                  item.specifications || "",

                quantity:
                  formatNumber(
                    item.quantity
                  ),

                priceUsd:
                  formatNumber(
                    item.priceUsd
                  ),

                priceSyp:
                  formatNumber(
                    item.priceSyp
                  ),

              })
            )
          : [
              {
                ...emptyItem,
              },
            ],
    });

    setShowAddForm(true);
  };

  // =====================================================
  // تعديل كشف
  // =====================================================

  const handleUpdate = async (
    e
  ) => {

    e.preventDefault();

    try {

      const totalAmountUsd =
        calculateTotalUsd(
          formData.items
        );

      const totalAmountSyp =
        calculateTotalSyp(
          formData.items
        );

      const updatedCheck = {

        customerName:
          formData.customerName.trim(),

        residence:
          formData.residence.trim(),

        date:
          formData.date,

        checkNumber:
          formData.checkNumber.trim(),

        bookNumber:
          formData.bookNumber.trim(),

        // ==========================================
        // سعر الدولار وقت الكشف
        // ==========================================

        exchangeRate:
          toNumber(
            formData.exchangeRate
          ),

        type:
          formData.type,

        totalAmountUsd:
          Number(
            totalAmountUsd.toFixed(2)
          ),

        totalAmountSyp:
          Number(
            totalAmountSyp.toFixed(0)
          ),

        items:
          formData.items.map(
            (item) => ({

              productType:
                item.productType.trim(),

              specifications:
                item.specifications.trim(),

              quantity:
                toNumber(
                  item.quantity
                ),

              priceUsd:
                toNumber(
                  item.priceUsd
                ),

              priceSyp:
                toNumber(
                  item.priceSyp
                ),

            })
          ),

        notes:
          formData.notes.trim(),
      };

      console.log(
        "بيانات التعديل:",
        updatedCheck
      );

      const response =
        await axios.put(
          `${API_URL}/${editId}`,
          updatedCheck
        );

      setChecks((prev) =>
        prev.map((check) =>
          String(check.id) ===
          String(editId)
            ? normalizeCheck(
                response.data
              )
            : check
        )
      );

      closeForm();

      alert(
        "تم تعديل الكشف بنجاح"
      );

    } catch (err) {

      console.error(err);

      alert(
        "حدث خطأ أثناء تعديل الكشف"
      );
    }
  };

  // =====================================================
  // تحديد نوع الكشف
  // =====================================================

  const getCheckType = (
    type
  ) => {

    const value =
      String(type || "")
        .toLowerCase();

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

  // =====================================================
  // فلترة
  // =====================================================

  const filteredChecks =
    filterType === "all"
      ? checks
      : checks.filter(
          (check) =>
            getCheckType(
              check.type
            ) === filterType
        );

  // =====================================================
  // تجميع حسب الزبون
  // =====================================================

  const customers = Array.from(
    new Set(
      filteredChecks
        .map(
          (check) =>
            check.customerName?.trim()
        )
        .filter(Boolean)
    )
  );

  // =====================================================
  // كشوف الزبون
  // =====================================================

  const getCustomerChecks = (
    customerName
  ) => {

    return filteredChecks.filter(
      (check) =>
        String(
          check.customerName || ""
        ).trim() ===
        String(
          customerName
        ).trim()
    );
  };

  // =====================================================
  // مكان إقامة الزبون
  // =====================================================

  const getCustomerResidence = (
    customerName
  ) => {

    const customerCheck =
      checks.find(
        (check) =>
          String(
            check.customerName || ""
          ).trim() ===
          String(
            customerName
          ).trim()
      );

    return (
      customerCheck?.residence ||
      ""
    );
  };

  // =====================================================
  // فتح التفاصيل
  // =====================================================

  const openCheck = (
    check
  ) => {

    setOpenedCheck(
      normalizeCheck(check)
    );
  };

  // =====================================================
  // JSX
  // =====================================================

  return (

    <div className="checks-page">

      {/* Navbar */}

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

      {/* Main */}

      <main className="checks-container">

        {/* Header */}

        <div className="checks-header">

          <div>

            <h1>
              كشوف الزبائن
            </h1>

            <p>
              يمكن للزبون الواحد امتلاك عدة كشوف
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

        {/* Filter */}

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

        {/* Loading */}

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

                const residence =
                  getCustomerResidence(
                    customerName
                  );

                return (

                  <div
                    className="customer-section"
                    key={customerName}
                  >

                    {/* Customer Header */}

                    <div className="customer-section-header">

                      <div className="customer-info">

                        <div className="customer-icon">
                          👤
                        </div>

                        <div>

                          <h2>
                            {customerName}
                          </h2>

                          {residence && (
                            <p className="customer-residence">
                              📍 {residence}
                            </p>
                          )}

                          <span>
                            {customerChecks.length} كشف
                          </span>

                        </div>

                      </div>

                      <button
                        className="add-check-small"
                        onClick={() =>
                          openAddForm(
                            customerName,
                            residence
                          )
                        }
                        title="إضافة كشف جديد لهذا الزبون"
                      >
                        +
                      </button>

                    </div>

                    {/* كشوف الزبون */}

                    <div className="customer-checks-grid">

                      {customerChecks.map(
                        (check) => {

                          const normalized =
                            normalizeCheck(
                              check
                            );

                          const totalUsd =
                            calculateTotalUsd(
                              normalized.items || []
                            );

                          const totalSyp =
                            calculateTotalSyp(
                              normalized.items || []
                            );

                          return (

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
                                      check.checkNumber ||
                                      "-"
                                    }
                                  </strong>

                                  <small>
                                    رقم الدفتر:{" "}
                                    {
                                      check.bookNumber ||
                                      "-"
                                    }
                                  </small>

                                </div>

                                <span
                                  className={`check-type ${
                                    getCheckType(
                                      check.type
                                    ) === "شراء"
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

                              {/* التاريخ */}

                              <div className="check-card-extra">

                                <div>

                                  <span>
                                    التاريخ
                                  </span>

                                  <strong>
                                    {
                                      check.date ||
                                      "-"
                                    }
                                  </strong>

                                </div>

                                {/* سعر الدولار */}

                                <div>

                                  <span>
                                    سعر الدولار
                                  </span>

                                  <strong>
                                    {check.exchangeRate
                                      ? formatNumber(
                                          check.exchangeRate
                                        )
                                      : "-"}
                                    {" "}
                                    ل.س
                                  </strong>

                                </div>

                              </div>

                              {/* القيمة الإجمالية */}

                              <div className="check-amount">

                                <div>

                                  <span>
                                    الإجمالي بالدولار
                                  </span>

                                  <strong>
                                    $
                                    {" "}
                                    {formatNumber(
                                      totalUsd.toFixed(2)
                                    )}
                                  </strong>

                                </div>

                                <div>

                                  <span>
                                    الإجمالي بالسوري
                                  </span>

                                  <strong>
                                    {formatNumber(
                                      totalSyp.toFixed(0)
                                    )}
                                    {" "}
                                    ل.س
                                  </strong>

                                </div>

                              </div>

                              {/* عدد المواد */}

                              <div className="check-details">

                                <div>

                                  <span>
                                    عدد المواد
                                  </span>

                                  <strong>
                                    {
                                      normalized
                                        .items
                                        ?.length ||
                                      0
                                    }
                                  </strong>

                                </div>

                                <div>

                                  <span>
                                    مكان الإقامة
                                  </span>

                                  <strong>
                                    {
                                      check.residence ||
                                      "-"
                                    }
                                  </strong>

                                </div>

                              </div>

                              {/* المواد */}

                              <div className="card-products">

                                {normalized.items
                                  ?.slice(0, 2)
                                  .map(
                                    (
                                      item,
                                      index
                                    ) => (

                                      <div
                                        className="card-product-row"
                                        key={index}
                                      >

                                        <strong>
                                          {
                                            item.productType ||
                                            "-"
                                          }
                                        </strong>

                                        <span>
                                          العدد:{" "}
                                          {
                                            formatNumber(
                                              item.quantity
                                            ) ||
                                            "-"
                                          }
                                        </span>

                                      </div>

                                    )
                                  )}

                                {normalized.items
                                  ?.length >
                                  2 && (

                                  <small>
                                    +
                                    {
                                      normalized
                                        .items
                                        .length -
                                      2
                                    }{" "}
                                    مواد أخرى
                                  </small>

                                )}

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
                          );
                        }
                      )}

                      {/* كرت كشف جديد */}

                      <button
                        className="new-check-card"
                        onClick={() =>
                          openAddForm(
                            customerName,
                            residence
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

      {/* Add / Edit Modal */}

      {showAddForm && (

        <CheckForm
          formData={formData}
          handleChange={handleChange}
          handleItemChange={
            handleItemChange
          }
          addItem={addItem}
          removeItem={removeItem}
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

      {/* View Check Modal */}

      {openedCheck && (

        <div className="modal-overlay">

          <div className="modal check-view-modal">

            {/* Header */}

            <div className="modal-header">

              <div>

                <h2>
                  كشف رقم #
                  {
                    openedCheck.checkNumber ||
                    "-"
                  }
                </h2>

                <span>
                  {
                    getCheckType(
                      openedCheck.type
                    )
                  }
                </span>

              </div>

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

              <div className="view-row">

                <span>
                  اسم الزبون
                </span>

                <strong>
                  {
                    openedCheck.customerName ||
                    "-"
                  }
                </strong>

              </div>

              <div className="view-row">

                <span>
                  مكان الإقامة
                </span>

                <strong>
                  {
                    openedCheck.residence ||
                    "-"
                  }
                </strong>

              </div>

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

              {/* رقم الدفتر */}

              <div className="view-row">

                <span>
                  رقم الدفتر
                </span>

                <strong>
                  {
                    openedCheck.bookNumber ||
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

              {/* =============================== */}
              {/* سعر الدولار */}
              {/* =============================== */}

              <div className="view-row exchange-rate-view">

                <span>
                  سعر الدولار وقت إنشاء الكشف
                </span>

                <strong>
                  {openedCheck.exchangeRate
                    ? formatNumber(
                        openedCheck.exchangeRate
                      )
                    : "-"}
                  {" "}
                  ل.س
                </strong>

              </div>

              {/* المواد */}

              <div className="view-items">

                <h3>
                  مواد الكشف
                </h3>

                {openedCheck.items?.map(
                  (item, index) => (

                    <div
                      className="view-item"
                      key={index}
                    >

                      <div className="view-item-header">

                        <strong>
                          المادة{" "}
                          {index + 1}
                        </strong>

                        <span>
                          {
                            item.productType ||
                            "-"
                          }
                        </span>

                      </div>

                      <div className="view-item-grid">

                        <div>

                          <span>
                            المواصفات
                          </span>

                          <strong>
                            {
                              item.specifications ||
                              "-"
                            }
                          </strong>

                        </div>

                        <div>

                          <span>
                            العدد
                          </span>

                          <strong>
                            {
                              formatNumber(
                                item.quantity
                              ) ||
                              "-"
                            }
                          </strong>

                        </div>

                        <div>

                          <span>
                            السعر بالدولار
                          </span>

                          <strong>
                            $
                            {" "}
                            {
                              formatNumber(
                                item.priceUsd
                              ) ||
                              "-"
                            }
                          </strong>

                        </div>

                        <div>

                          <span>
                            السعر بالسوري
                          </span>

                          <strong>
                            {
                              formatNumber(
                                item.priceSyp
                              ) ||
                              "-"
                            }
                            {" "}
                            ل.س
                          </strong>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

              {/* الإجماليات */}

              <div className="view-total">

                <div>

                  <span>
                    القيمة الإجمالية بالدولار
                  </span>

                  <strong>
                    $
                    {" "}
                    {formatNumber(
                      calculateTotalUsd(
                        openedCheck.items || []
                      ).toFixed(2)
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    القيمة الإجمالية بالسوري
                  </span>

                  <strong>
                    {formatNumber(
                      calculateTotalSyp(
                        openedCheck.items || []
                      ).toFixed(0)
                    )}
                    {" "}
                    ل.س
                  </strong>

                </div>

              </div>

              {/* الملاحظات */}

              <div className="view-row notes-row">

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

                  setOpenedCheck(
                    null
                  );

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