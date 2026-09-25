
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
// تحديد حالة الدفع الافتراضية حسب نوع الكشف
// =====================================================

const getDefaultPaymentStatus = (type) => {
  if (type === "بيع" || type === "sale") {
    return "غير مقبوض";
  }

  if (type === "شراء" || type === "purchase") {
    return "غير مدفوع";
  }

  return "";
};

// =====================================================
// فورم الكشف الفارغ
// =====================================================

const emptyForm = {
  customerName: "",
  phone: "",
  residence: "",
  date: "",
  checkNumber: "",
  bookNumber: "",
  exchangeRate: "",
  type: "شراء",
  paymentStatus: "غير مدفوع",
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

  const number = Number(cleaned);

  return isNaN(number) ? 0 : number;
};

// =====================================================
// حساب إجمالي كشف واحد بالدولار
// =====================================================

const calculateTotalUsd = (items = []) => {
  return items.reduce((total, item) => {
    const quantity = toNumber(item.quantity);
    const priceUsd = toNumber(item.priceUsd);

    return total + quantity * priceUsd;
  }, 0);
};

// =====================================================
// حساب إجمالي كشف واحد بالسوري
// =====================================================

const calculateTotalSyp = (items = []) => {
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

  const defaultStatus = getDefaultPaymentStatus(
    check.type
  );

  // ===================================================
  // إذا كان الكشف جديد ويحتوي على items
  // ===================================================

  if (Array.isArray(check.items)) {
    return {
      ...check,

      customerName:
        check.customerName ||
        check.recipientName ||
        "",

      phone: check.phone || "",

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

      paymentStatus:
        check.paymentStatus ||
        defaultStatus,

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

  // ===================================================
  // تحويل الكشف القديم
  // ===================================================

  return {
    ...check,

    customerName:
      check.customerName ||
      check.recipientName ||
      "",

    phone: check.phone || "",

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

    paymentStatus:
      check.paymentStatus ||
      defaultStatus,

    items: [
      {
        productType:
          check.productType || "",

        specifications:
          check.specifications || "",

        quantity:
          check.quantity ?? "",

        priceUsd:
          check.price ?? "",

        priceSyp:
          check.priceSyp ?? "",
      },
    ],
  };
};

// =====================================================
// إجمالي كل كشوف الزبون بالدولار
// =====================================================

const calculateCustomerTotalUsd = (
  customerChecks = []
) => {
  return customerChecks.reduce(
    (total, check) => {
      const normalized =
        normalizeCheck(check);

      const checkTotal =
        calculateTotalUsd(
          normalized.items || []
        );

      return total + checkTotal;
    },
    0
  );
};

// =====================================================
// إجمالي كل كشوف الزبون بالسوري
// =====================================================

const calculateCustomerTotalSyp = (
  customerChecks = []
) => {
  return customerChecks.reduce(
    (total, check) => {
      const normalized =
        normalizeCheck(check);

      const checkTotal =
        calculateTotalSyp(
          normalized.items || []
        );

      return total + checkTotal;
    },
    0
  );
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
  const totalUsd =
    calculateTotalUsd(formData.items);

  const totalSyp =
    calculateTotalSyp(formData.items);

  return (
    <div className="modal-overlay">
      <div className="modal check-form-modal">

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

        <form
          className="check-form"
          onSubmit={handleSubmit}
        >

          <div className="form-section-title">
            بيانات الزبون
          </div>

          <div className="form-group">
            <label>اسم الزبون</label>

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
            <label>رقم التليفون</label>

            <input
              type="tel"
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
              placeholder="أدخل رقم التليفون"
            />
          </div>

          <div className="form-group">
            <label>مكان الإقامة</label>

            <input
              type="text"
              name="residence"
              value={formData.residence}
              onChange={handleChange}
              placeholder="مثال: حلب - الحمدانية"
              required
            />
          </div>

          <div className="form-section-title">
            بيانات الكشف
          </div>

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

          <div className="form-group">
            <label>رقم الدفتر</label>

            <input
              type="text"
              name="bookNumber"
              value={formData.bookNumber}
              onChange={handleChange}
              placeholder="أدخل رقم الدفتر"
              required
            />
          </div>

          <div className="form-group">
            <label>التاريخ</label>

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>نوع الكشف</label>

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

          <div className="form-group payment-status-group">
            <label>حالة الدفع</label>

            {formData.type === "بيع" ? (
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
              >
                <option value="غير مقبوض">
                  غير مقبوض
                </option>

                <option value="مقبوض">
                  مقبوض
                </option>
              </select>
            ) : (
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
              >
                <option value="غير مدفوع">
                  غير مدفوع
                </option>

                <option value="مدفوع">
                  مدفوع
                </option>
              </select>
            )}
          </div>

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

          <div className="form-section-title items-title">
            <span>مواد الكشف</span>

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

          <div className="form-section-title">
            ملاحظات
          </div>

          <div className="form-group full-width">
            <label>الملاحظات</label>

            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="أدخل الملاحظات..."
            />
          </div>

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

  // ===================================================
  // فلتر الكشوف
  // all = الكل
  // sale = البيع
  // purchase = الشراء
  // ===================================================

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

    // تغيير نوع الكشف
    if (name === "type") {

      setFormData((prev) => ({
        ...prev,
        type: value,

        paymentStatus:
          editId
            ? prev.paymentStatus
            : getDefaultPaymentStatus(value),
      }));

      return;
    }

    // حالة الدفع
    if (name === "paymentStatus") {

      setFormData((prev) => ({
        ...prev,
        paymentStatus: value,
      }));

      return;
    }

    // سعر الدولار
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

    // باقي الحقول
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
          parts.slice(1).join("");
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

    const previousCustomerCheck =
      checks.find(
        (check) =>
          String(
            check.customerName || ""
          ).trim() ===
          String(
            customerName || ""
          ).trim() &&
          check.phone
      );

    const defaultType = "شراء";

    setFormData({

      ...emptyForm,

      customerName:
        customerName,

      phone:
        previousCustomerCheck?.phone || "",

      residence:
        residence,

      date:
        new Date()
          .toISOString()
          .split("T")[0],

      type:
        defaultType,

      paymentStatus:
        getDefaultPaymentStatus(
          defaultType
        ),

      items: [
        { ...emptyItem }
      ],
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
      items: [
        { ...emptyItem }
      ],
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

        phone:
          (formData.phone || "").trim(),

        residence:
          formData.residence.trim(),

        date:
          formData.date,

        checkNumber:
          formData.checkNumber.trim(),

        bookNumber:
          formData.bookNumber.trim(),

        exchangeRate:
          toNumber(
            formData.exchangeRate
          ),

        type:
          formData.type,

        paymentStatus:
          formData.paymentStatus ||
          getDefaultPaymentStatus(
            formData.type
          ),

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

    setEditId(check.id);

    setSelectedCustomer(
      normalized.customerName || ""
    );

    setFormData({

      customerName:
        normalized.customerName || "",

      phone:
        normalized.phone || "",

      residence:
        normalized.residence || "",

      date:
        normalized.date || "",

      checkNumber:
        normalized.checkNumber || "",

      bookNumber:
        normalized.bookNumber || "",

      exchangeRate:
        normalized.exchangeRate !== ""
          ? formatNumber(
              normalized.exchangeRate
            )
          : "",

      type:
        normalized.type || "شراء",

      paymentStatus:
        normalized.paymentStatus ||
        getDefaultPaymentStatus(
          normalized.type || "شراء"
        ),

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

  const handleUpdate = async (e) => {

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

        phone:
          (formData.phone || "").trim(),

        residence:
          formData.residence.trim(),

        date:
          formData.date,

        checkNumber:
          formData.checkNumber.trim(),

        bookNumber:
          formData.bookNumber.trim(),

        exchangeRate:
          toNumber(
            formData.exchangeRate
          ),

        type:
          formData.type,

        paymentStatus:
          formData.paymentStatus ||
          getDefaultPaymentStatus(
            formData.type
          ),

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

  const getCheckType = (type) => {

    const value =
      String(type || "")
        .trim()
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

    return type || "";
  };

  // =====================================================
  // الفلترة
  // =====================================================

  const filteredChecks = checks.filter(
    (check) => {

      // إذا اختار الكل
      if (filterType === "all") {
        return true;
      }

      // نوع الكشف بعد توحيده
      const checkType =
        getCheckType(check.type);

      // فلترة شراء
      if (
        filterType === "purchase" &&
        checkType === "شراء"
      ) {
        return true;
      }

      // فلترة بيع
      if (
        filterType === "sale" &&
        checkType === "بيع"
      ) {
        return true;
      }

      return false;
    }
  );

  // =====================================================
  // تجميع الزبائن حسب الفلتر
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
  // رقم تليفون الزبون
  // =====================================================

  const getCustomerPhone = (
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
          ).trim() &&
          check.phone
      );

    return (
      customerCheck?.phone ||
      ""
    );
  };

  // =====================================================
  // فتح التفاصيل
  // =====================================================

  const openCheck = (check) => {

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

        {/* =================================================
            FILTER
        ================================================= */}

        <div className="checks-filter">

          <span>
            فلترة الكشوف:
          </span>

          {/* الكل */}

          <button
            type="button"
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

          {/* البيع */}

          <button
            type="button"
            className={`filter-btn ${
              filterType === "sale"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilterType("sale")
            }
          >
            كشوف البيع
          </button>

          {/* الشراء */}

          <button
            type="button"
            className={`filter-btn ${
              filterType === "purchase"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilterType("purchase")
            }
          >
            كشوف الشراء
          </button>

        </div>

        {/* =================================================
            عدد الكشوف حسب الفلتر
        ================================================= */}

        {!loading && (
          <div className="filter-result-info">

            {filterType === "all" && (
              <>
                جميع الكشوف:
                {" "}
                <strong>
                  {filteredChecks.length}
                </strong>
              </>
            )}

            {filterType === "sale" && (
              <>
                كشوف البيع:
                {" "}
                <strong>
                  {filteredChecks.length}
                </strong>
              </>
            )}

            {filterType === "purchase" && (
              <>
                كشوف الشراء:
                {" "}
                <strong>
                  {filteredChecks.length}
                </strong>
              </>
            )}

          </div>
        )}

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
              لا يوجد كشوف ضمن الفلترة المحددة
            </p>

            {filterType !== "all" && (
              <button
                className="btn btn-add"
                onClick={() =>
                  setFilterType("all")
                }
              >
                عرض كل الكشوف
              </button>
            )}

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

                const phone =
                  getCustomerPhone(
                    customerName
                  );

                // مهم:
                // الإجمالي هون محسوب فقط للكشوف
                // الموجودة ضمن الفلتر الحالي

                const customerTotalUsd =
                  calculateCustomerTotalUsd(
                    customerChecks
                  );

                const customerTotalSyp =
                  calculateCustomerTotalSyp(
                    customerChecks
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

                          {phone && (
                            <p className="customer-residence">
                              📞 {phone}
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

                    {/* إجمالي الزبون حسب الفلتر */}

                    <div className="customer-total-box">

                      <div className="customer-total-title">

                        {filterType === "all"
                          ? "إجمالي جميع كشوف الزبون"
                          : filterType === "sale"
                          ? "إجمالي كشوف البيع"
                          : "إجمالي كشوف الشراء"}

                      </div>

                      <div className="customer-total-values">

                        <div className="customer-total-item usd-total">

                          <span>
                            الإجمالي بالدولار
                          </span>

                          <strong>
                            $
                            {" "}
                            {formatNumber(
                              customerTotalUsd.toFixed(2)
                            )}
                          </strong>

                        </div>

                        <div className="customer-total-item syp-total">

                          <span>
                            الإجمالي بالسوري
                          </span>

                          <strong>
                            {formatNumber(
                              customerTotalSyp.toFixed(0)
                            )}
                            {" "}
                            ل.س
                          </strong>

                        </div>

                      </div>

                    </div>

                    {/* كشوف الزبون */}

                    <div className="customer-checks-grid">

                      {customerChecks.map(
                        (check) => {

                          const normalized =
                            normalizeCheck(check);

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

                              {/* حالة الدفع */}

                              <div className="payment-status-display">

                                <span>
                                  حالة الدفع :
                                </span>

                                <strong
                                  className={
                                    check.paymentStatus ===
                                      "مقبوض" ||
                                    check.paymentStatus ===
                                      "مدفوع"
                                      ? "paid"
                                      : "unpaid"
                                  }
                                >
                                  {check.paymentStatus ||
                                    getDefaultPaymentStatus(
                                      check.type
                                    )}
                                </strong>

                              </div>

                              {/* التاريخ وسعر الدولار */}

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
                                      normalized.items
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
                  رقم التليفون
                </span>

                <strong>
                  {
                    openedCheck.phone ||
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

              <div className="view-row payment-status-view">

                <span>
                  حالة الدفع :
                </span>

                <strong
                  className={
                    openedCheck.paymentStatus ===
                      "مقبوض" ||
                    openedCheck.paymentStatus ===
                      "مدفوع"
                      ? "paid"
                      : "unpaid"
                  }
                >
                  {
                    openedCheck.paymentStatus ||
                    getDefaultPaymentStatus(
                      openedCheck.type
                    )
                  }
                </strong>

              </div>

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

