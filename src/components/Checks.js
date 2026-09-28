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
// فورم الكشف
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
// أدوات الأرقام
// =====================================================

const removeCommas = (value) => {
  return String(value ?? "").replace(/,/g, "");
};

const toNumber = (value) => {
  const cleaned = removeCommas(value);

  if (cleaned === "") {
    return 0;
  }

  const number = Number(cleaned);

  return Number.isNaN(number) ? 0 : number;
};

const formatNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const cleanValue = removeCommas(value);

  if (!/^\d*\.?\d*$/.test(cleanValue)) {
    return String(value);
  }

  const parts = cleanValue.split(".");
  const integerPart = parts[0] || "0";
  const decimalPart = parts[1];

  const formattedInteger = Number(
    integerPart
  ).toLocaleString("en-US");

  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  }

  return formattedInteger;
};

// =====================================================
// نوع الكشف
// =====================================================

const getCheckTypeValue = (type) => {
  const value = String(type || "")
    .trim()
    .toLowerCase();

  if (
    value === "بيع" ||
    value === "sale"
  ) {
    return "بيع";
  }

  if (
    value === "شراء" ||
    value === "purchase"
  ) {
    return "شراء";
  }

  if (
    value === "مرتجع" ||
    value === "return"
  ) {
    return "مرتجع";
  }

  return type || "";
};

// =====================================================
// حالة الدفع
// =====================================================

const getDefaultPaymentStatus = (type) => {
  const normalizedType =
    getCheckTypeValue(type);

  if (normalizedType === "بيع") {
    return "غير مقبوض";
  }

  if (normalizedType === "شراء") {
    return "غير مدفوع";
  }

  return "";
};

// =====================================================
// حساب إجمالي المواد
// =====================================================

const calculateTotalUsd = (items = []) => {
  return items.reduce((total, item) => {
    return (
      total +
      toNumber(item.quantity) *
        toNumber(item.priceUsd)
    );
  }, 0);
};

const calculateTotalSyp = (items = []) => {
  return items.reduce((total, item) => {
    return (
      total +
      toNumber(item.quantity) *
        toNumber(item.priceSyp)
    );
  }, 0);
};

// =====================================================
// تطبيع الكشف
// =====================================================

const normalizeCheck = (check) => {
  if (!check) {
    return null;
  }

  const type = getCheckTypeValue(
    check.type
  );

  let normalizedItems = [];

  if (Array.isArray(check.items)) {
    normalizedItems = check.items.map(
      (item) => ({
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
      })
    );
  } else {
    // دعم البيانات القديمة
    normalizedItems = [
      {
        productType:
          check.productType || "",

        specifications:
          check.specifications || "",

        quantity:
          check.quantity ?? "",

        priceUsd:
          check.price ??
          check.priceUsd ??
          "",

        priceSyp:
          check.priceSyp ?? "",
      },
    ];
  }

  return {
    ...check,

    customerName:
      check.customerName ||
      check.recipientName ||
      "",

    phone:
      check.phone || "",

    residence:
      check.residence || "",

    date:
      check.date || "",

    checkNumber:
      check.checkNumber || "",

    bookNumber:
      check.bookNumber ||
      check.دفترNumber ||
      check.دفنر ||
      "",

    exchangeRate:
      check.exchangeRate ??
      check.dollarRate ??
      check.usdRate ??
      "",

    type,

    paymentStatus:
      check.paymentStatus ||
      getDefaultPaymentStatus(type),

    items:
      normalizedItems,

    // -------------------------------------------------
    // المرتجعات الموجودة داخل نفس الكشف
    // -------------------------------------------------

    returnItems:
      Array.isArray(check.returnItems)
        ? check.returnItems.map(
            (item) => ({
              productType:
                item.productType || "",

              specifications:
                item.specifications || "",

              quantity:
                item.quantity ?? "",

              priceUsd:
                item.priceUsd ?? "",

              priceSyp:
                item.priceSyp ?? "",
            })
          )
        : [],

    returnNotes:
      check.returnNotes || "",

    notes:
      check.notes || "",
  };
};

// =====================================================
// إجمالي المرتجع
// =====================================================

const calculateReturnTotalUsd = (check) => {
  return calculateTotalUsd(
    check?.returnItems || []
  );
};

const calculateReturnTotalSyp = (check) => {
  return calculateTotalSyp(
    check?.returnItems || []
  );
};

// =====================================================
// الصافي
// =====================================================

const calculateNetTotalUsd = (check) => {
  const original =
    calculateTotalUsd(
      check?.items || []
    );

  const returned =
    calculateReturnTotalUsd(check);

  return Math.max(
    0,
    original - returned
  );
};

const calculateNetTotalSyp = (check) => {
  const original =
    calculateTotalSyp(
      check?.items || []
    );

  const returned =
    calculateReturnTotalSyp(check);

  return Math.max(
    0,
    original - returned
  );
};

// =====================================================
// حساب الكمية المرتجعة سابقًا لمادة معينة
//
// المطابقة تكون حسب:
// نوع المادة + المواصفات + السعر
// =====================================================

const getReturnedQuantityForItem = (
  check,
  originalItem
) => {
  if (
    !check ||
    !Array.isArray(check.returnItems)
  ) {
    return 0;
  }

  return check.returnItems.reduce(
    (total, returnItem) => {

      const sameProduct =
        String(
          returnItem.productType || ""
        ).trim() ===
        String(
          originalItem.productType || ""
        ).trim();

      const sameSpecifications =
        String(
          returnItem.specifications || ""
        ).trim() ===
        String(
          originalItem.specifications || ""
        ).trim();

      const samePriceUsd =
        Math.abs(
          toNumber(
            returnItem.priceUsd
          ) -
            toNumber(
              originalItem.priceUsd
            )
        ) < 0.000001;

      const samePriceSyp =
        Math.abs(
          toNumber(
            returnItem.priceSyp
          ) -
            toNumber(
              originalItem.priceSyp
            )
        ) < 0.000001;

      if (
        sameProduct &&
        sameSpecifications &&
        samePriceUsd &&
        samePriceSyp
      ) {
        return (
          total +
          toNumber(
            returnItem.quantity
          )
        );
      }

      return total;
    },
    0
  );
};

// =====================================================
// فورم تعديل / إضافة كشف
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
    calculateTotalUsd(
      formData.items
    );

  const totalSyp =
    calculateTotalSyp(
      formData.items
    );

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

            {selectedCustomer &&
              !editMode && (
                <small>
                  إضافة كشف جديد لنفس الزبون
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

          {/* =========================================
              بيانات الزبون
          ========================================= */}

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
              value={
                formData.customerName
              }
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
              رقم التليفون
            </label>

            <input
              type="tel"
              name="phone"
              value={
                formData.phone || ""
              }
              onChange={handleChange}
              placeholder="أدخل رقم التليفون"
            />

          </div>

          <div className="form-group">

            <label>
              مكان الإقامة
            </label>

            <input
              type="text"
              name="residence"
              value={
                formData.residence
              }
              onChange={handleChange}
              placeholder="مثال: حلب - السريان القديمة"
              required
            />

          </div>

          {/* =========================================
              بيانات الكشف
          ========================================= */}

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
              value={
                formData.checkNumber
              }
              onChange={handleChange}
              required
            />

          </div>

          <div className="form-group">

            <label>
              رقم الدفتر
            </label>

            <input
              type="text"
              name="bookNumber"
              value={
                formData.bookNumber
              }
              onChange={handleChange}
              required
            />

          </div>

          <div className="form-group">

            <label>
              التاريخ
            </label>

            <input
              type="date"
              name="date"
              value={
                formData.date
              }
              onChange={handleChange}
              required
            />

          </div>

          <div className="form-group">

            <label>
              نوع الكشف
            </label>

            <select
              name="type"
              value={
                formData.type
              }
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

          <div className="form-group">

            <label>
              حالة الدفع
            </label>

            {formData.type === "بيع" ? (

              <select
                name="paymentStatus"
                value={
                  formData.paymentStatus
                }
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
                value={
                  formData.paymentStatus
                }
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

          <div className="form-group">

            <label>
              سعر الدولار وقت إنشاء الكشف
            </label>

            <input
              type="text"
              inputMode="decimal"
              name="exchangeRate"
              value={
                formData.exchangeRate
              }
              onChange={handleChange}
              placeholder="مثال: 13,333"
              required
            />

          </div>

          {/* =========================================
              المواد
          ========================================= */}

          <div className="form-section-title">
            مواد الكشف
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

                    {formData.items.length >
                      1 && (
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() =>
                          removeItem(
                            index
                          )
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
                        required
                      />

                    </div>

                  </div>

                </div>

              )
            )}

            <button
              type="button"
              className="add-item-btn"
              onClick={addItem}
            >
              + إضافة مادة
            </button>

          </div>

          {/* =========================================
              الإجمالي
          ========================================= */}

          <div className="total-preview">

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

          {/* =========================================
              ملاحظات
          ========================================= */}

          <div className="form-section-title">
            ملاحظات
          </div>

          <div className="form-group full-width">

            <textarea
              name="notes"
              value={
                formData.notes
              }
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
// الصفحة
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

  // ===================================================
  // المرتجع
  // ===================================================

  const [returnCheck, setReturnCheck] =
    useState(null);

  const [returnItems, setReturnItems] =
    useState([]);

  const [returnNotes, setReturnNotes] =
    useState("");

  // ===================================================
  // جلب البيانات
  // ===================================================

  const getChecks = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await axios.get(
          API_URL
        );

      if (
        Array.isArray(
          response.data
        )
      ) {

        setChecks(
          response.data.map(
            normalizeCheck
          )
        );

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

  // ===================================================
  // تغيير بيانات الكشف
  // ===================================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    if (name === "type") {

      setFormData(
        (prev) => ({
          ...prev,

          type: value,

          paymentStatus:
            getDefaultPaymentStatus(
              value
            ),
        })
      );

      return;
    }

    if (
      name ===
      "paymentStatus"
    ) {

      setFormData(
        (prev) => ({
          ...prev,

          paymentStatus:
            value,
        })
      );

      return;
    }

    if (
      name ===
      "exchangeRate"
    ) {

      let cleanValue =
        value.replace(
          /[^\d.]/g,
          ""
        );

      const parts =
        cleanValue.split(".");

      if (
        parts.length > 2
      ) {

        cleanValue =
          parts[0] +
          "." +
          parts
            .slice(1)
            .join("");

      }

      setFormData(
        (prev) => ({
          ...prev,

          exchangeRate:
            formatNumber(
              cleanValue
            ),
        })
      );

      return;
    }

    setFormData(
      (prev) => ({
        ...prev,
        [name]: value,
      })
    );
  };

  // ===================================================
  // تغيير مادة الكشف
  // ===================================================

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
      numberFields.includes(
        field
      )
    ) {

      let cleanValue =
        value.replace(
          /[^\d.]/g,
          ""
        );

      const parts =
        cleanValue.split(".");

      if (
        parts.length > 2
      ) {

        cleanValue =
          parts[0] +
          "." +
          parts
            .slice(1)
            .join("");

      }

      cleanValue =
        formatNumber(
          cleanValue
        );

      setFormData(
        (prev) => {

          const items =
            [...prev.items];

          items[index] = {
            ...items[index],
            [field]:
              cleanValue,
          };

          return {
            ...prev,
            items,
          };
        }
      );

      return;
    }

    setFormData(
      (prev) => {

        const items =
          [...prev.items];

        items[index] = {
          ...items[index],
          [field]: value,
        };

        return {
          ...prev,
          items,
        };
      }
    );
  };

  // ===================================================
  // إضافة مادة
  // ===================================================

  const addItem = () => {

    setFormData(
      (prev) => ({
        ...prev,

        items: [
          ...prev.items,
          { ...emptyItem },
        ],
      })
    );
  };

  // ===================================================
  // حذف مادة
  // ===================================================

  const removeItem = (
    index
  ) => {

    setFormData(
      (prev) => ({
        ...prev,

        items:
          prev.items.filter(
            (_, i) =>
              i !== index
          ),
      })
    );
  };

  // ===================================================
  // فتح إضافة كشف
  // ===================================================

  const openAddForm = (
    customerName = "",
    residence = ""
  ) => {

    setSelectedCustomer(
      customerName
    );

    const previousCheck =
      checks.find(
        (check) =>
          String(
            check.customerName ||
              ""
          ).trim() ===
            String(
              customerName ||
                ""
            ).trim() &&
          check.phone
      );

    setFormData({
      ...emptyForm,

      customerName,

      phone:
        previousCheck?.phone ||
        "",

      residence,

      date:
        new Date()
          .toISOString()
          .split("T")[0],

      type: "شراء",

      paymentStatus:
        "غير مدفوع",

      items: [
        { ...emptyItem },
      ],
    });

    setEditId(null);

    setShowAddForm(true);
  };

  // ===================================================
  // إغلاق فورم الكشف
  // ===================================================

  const closeForm = () => {

    setShowAddForm(false);

    setEditId(null);

    setSelectedCustomer("");

    setFormData({
      ...emptyForm,
      items: [
        { ...emptyItem },
      ],
    });
  };

  // ===================================================
  // توليد ID
  // ===================================================

  const generateId = () => {

    const numericIds =
      checks
        .map((check) =>
          Number(check.id)
        )
        .filter(
          (id) =>
            !Number.isNaN(id)
        );

    if (
      numericIds.length > 0
    ) {

      return String(
        Math.max(
          ...numericIds
        ) + 1
      );

    }

    return String(
      Date.now()
    );
  };

  // ===================================================
  // إضافة كشف
  // ===================================================

  const handleAdd = async (
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

      const newCheck = {

        id:
          generateId(),

        customerName:
          formData.customerName.trim(),

        phone:
          (
            formData.phone ||
            ""
          ).trim(),

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

        // المرتجع داخل نفس الكشف
        returnItems: [],

        returnNotes: "",

        notes:
          formData.notes.trim(),
      };

      const response =
        await axios.post(
          API_URL,
          newCheck
        );

      const normalized =
        normalizeCheck(
          response.data
        );

      setChecks(
        (prev) => [
          ...prev,
          normalized,
        ]
      );

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

  // ===================================================
  // حذف كشف
  // ===================================================

  const handleDelete = async (
    id
  ) => {

    const confirmed =
      window.confirm(
        "هل أنت متأكد من حذف هذا الكشف؟"
      );

    if (!confirmed) {
      return;
    }

    try {

      await axios.delete(
        `${API_URL}/${id}`
      );

      setChecks(
        (prev) =>
          prev.filter(
            (check) =>
              String(
                check.id
              ) !==
              String(id)
          )
      );

      if (
        openedCheck &&
        String(
          openedCheck.id
        ) === String(id)
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

  // ===================================================
  // تعديل كشف
  // ===================================================

  const handleEdit = (
    check
  ) => {

    const normalized =
      normalizeCheck(check);

    setEditId(
      check.id
    );

    setSelectedCustomer(
      normalized.customerName
    );

    setFormData({

      customerName:
        normalized.customerName,

      phone:
        normalized.phone,

      residence:
        normalized.residence,

      date:
        normalized.date,

      checkNumber:
        normalized.checkNumber,

      bookNumber:
        normalized.bookNumber,

      exchangeRate:
        normalized.exchangeRate !==
        ""
          ? formatNumber(
              normalized.exchangeRate
            )
          : "",

      type:
        normalized.type ===
        "مرتجع"
          ? "شراء"
          : normalized.type,

      paymentStatus:
        normalized.paymentStatus ||
        getDefaultPaymentStatus(
          normalized.type ===
            "مرتجع"
            ? "شراء"
            : normalized.type
        ),

      notes:
        normalized.notes,

      items:
        normalized.items.map(
          (item) => ({
            productType:
              item.productType,

            specifications:
              item.specifications,

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
        ),
    });

    setShowAddForm(
      true
    );
  };

  // ===================================================
  // تحديث كشف
  // ===================================================

  const handleUpdate = async (
    e
  ) => {

    e.preventDefault();

    try {

      const currentCheck =
        checks.find(
          (check) =>
            String(
              check.id
            ) ===
            String(editId)
        );

      const normalized =
        normalizeCheck(
          currentCheck
        );

      const totalAmountUsd =
        calculateTotalUsd(
          formData.items
        );

      const totalAmountSyp =
        calculateTotalSyp(
          formData.items
        );

      const updatedCheck = {

        ...normalized,

        customerName:
          formData.customerName.trim(),

        phone:
          (
            formData.phone ||
            ""
          ).trim(),

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

        // المحافظة على المرتجع
        returnItems:
          normalized.returnItems ||
          [],

        returnNotes:
          normalized.returnNotes ||
          "",

        netTotalUsd:
          Number(
            (
              totalAmountUsd -
              calculateReturnTotalUsd(
                normalized
              )
            ).toFixed(2)
          ),

        netTotalSyp:
          Number(
            (
              totalAmountSyp -
              calculateReturnTotalSyp(
                normalized
              )
            ).toFixed(0)
          ),

        notes:
          formData.notes.trim(),
      };

      const response =
        await axios.put(
          `${API_URL}/${editId}`,
          updatedCheck
        );

      const normalizedResponse =
        normalizeCheck(
          response.data
        );

      setChecks(
        (prev) =>
          prev.map(
            (check) =>
              String(
                check.id
              ) ===
              String(editId)
                ? normalizedResponse
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

  // ===================================================
  // فتح المرتجع
  //
  // هون أهم تعديل:
  // المواد تنجلب تلقائيًا من الكشف الأصلي
  // ===================================================

  const openReturnForm = (
    check
  ) => {

    const normalized =
      normalizeCheck(check);

    const preparedItems =
      normalized.items.map(
        (item) => {

          const originalQuantity =
            toNumber(
              item.quantity
            );

          const returnedQuantity =
            getReturnedQuantityForItem(
              normalized,
              item
            );

          const remainingQuantity =
            Math.max(
              0,
              originalQuantity -
                returnedQuantity
            );

          return {

            // المعلومات تنجلب تلقائيًا
            productType:
              item.productType,

            specifications:
              item.specifications,

            priceUsd:
              item.priceUsd,

            priceSyp:
              item.priceSyp,

            // نخلي كمية المرتجع صفر
            // والمستخدم يدخلها
            quantity: "",

            // معلومات إضافية للعرض
            originalQuantity,

            returnedQuantity,

            remainingQuantity,
          };
        }
      );

    setReturnCheck(
      normalized
    );

    setReturnItems(
      preparedItems
    );

    setReturnNotes("");

  };

  // ===================================================
  // تغيير كمية المرتجع
  // ===================================================

  const handleReturnQuantityChange = (
    index,
    value
  ) => {

    let cleanValue =
      value.replace(
        /[^\d.]/g,
        ""
      );

    const parts =
      cleanValue.split(".");

    if (
      parts.length > 2
    ) {

      cleanValue =
        parts[0] +
        "." +
        parts
          .slice(1)
          .join("");
    }

    cleanValue =
      formatNumber(
        cleanValue
      );

    setReturnItems(
      (prev) => {

        const items =
          [...prev];

        const item =
          items[index];

        const maxQuantity =
          toNumber(
            item.remainingQuantity
          );

        const enteredQuantity =
          toNumber(
            cleanValue
          );

        if (
          enteredQuantity >
          maxQuantity
        ) {

          alert(
            `الكمية المتبقية من هذه المادة هي ${formatNumber(
              maxQuantity
            )}`
          );

          items[index] = {
            ...item,
            quantity:
              maxQuantity > 0
                ? formatNumber(
                    maxQuantity
                  )
                : "",
          };

          return items;
        }

        items[index] = {
          ...item,
          quantity:
            cleanValue,
        };

        return items;
      }
    );
  };

  // ===================================================
  // إغلاق المرتجع
  // ===================================================

  const closeReturnForm = () => {

    setReturnCheck(null);

    setReturnItems([]);

    setReturnNotes("");
  };

  // ===================================================
  // حفظ المرتجع
  // ===================================================

  const handleReturnSubmit = async (
    e
  ) => {

    e.preventDefault();

    if (!returnCheck) {
      return;
    }

    try {

      const normalized =
        normalizeCheck(
          returnCheck
        );

      // -----------------------------------------------
      // المواد التي فعلاً عليها كمية مرتجعة
      // -----------------------------------------------

      const selectedReturnItems =
        returnItems
          .filter(
            (item) =>
              toNumber(
                item.quantity
              ) > 0
          );

      if (
        selectedReturnItems.length ===
        0
      ) {

        alert(
          "حددي كمية مرتجعة لمادة واحدة على الأقل."
        );

        return;
      }

      // -----------------------------------------------
      // تحقق نهائي من الكميات
      // -----------------------------------------------

      for (
        const item of selectedReturnItems
      ) {

        const quantity =
          toNumber(
            item.quantity
          );

        const remaining =
          toNumber(
            item.remainingQuantity
          );

        if (
          quantity >
          remaining
        ) {

          alert(
            `الكمية المرتجعة للمادة "${item.productType}" أكبر من الكمية المتبقية.`
          );

          return;
        }
      }

      // -----------------------------------------------
      // تحويل المواد لصيغة التخزين
      // -----------------------------------------------

      const newReturnItems =
        selectedReturnItems.map(
          (item) => ({
            productType:
              item.productType,

            specifications:
              item.specifications,

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
        );

      // -----------------------------------------------
      // إضافة المرتجع الجديد إلى المرتجعات السابقة
      // -----------------------------------------------

      const updatedReturnItems = [
        ...(normalized.returnItems ||
          []),
        ...newReturnItems,
      ];

      const originalTotalUsd =
        calculateTotalUsd(
          normalized.items
        );

      const originalTotalSyp =
        calculateTotalSyp(
          normalized.items
        );

      const totalReturnUsd =
        calculateTotalUsd(
          updatedReturnItems
        );

      const totalReturnSyp =
        calculateTotalSyp(
          updatedReturnItems
        );

      const netTotalUsd =
        Math.max(
          0,
          originalTotalUsd -
            totalReturnUsd
        );

      const netTotalSyp =
        Math.max(
          0,
          originalTotalSyp -
            totalReturnSyp
        );

      // -----------------------------------------------
      // تحديث نفس الكشف
      // -----------------------------------------------

      const updatedCheck = {

        ...normalized,

        // النوع يبقى شراء أو بيع
        type:
          normalized.type ===
          "مرتجع"
            ? "شراء"
            : normalized.type,

        totalAmountUsd:
          Number(
            originalTotalUsd.toFixed(2)
          ),

        totalAmountSyp:
          Number(
            originalTotalSyp.toFixed(0)
          ),

        returnItems:
          updatedReturnItems,

        returnNotes:
          returnNotes.trim(),

        netTotalUsd:
          Number(
            netTotalUsd.toFixed(2)
          ),

        netTotalSyp:
          Number(
            netTotalSyp.toFixed(0)
          ),
      };

      // -----------------------------------------------
      // PUT لنفس ID
      // -----------------------------------------------

      const response =
        await axios.put(
          `${API_URL}/${normalized.id}`,
          updatedCheck
        );

      const updated =
        normalizeCheck(
          response.data
        );

      // تحديث القائمة
      setChecks(
        (prev) =>
          prev.map(
            (check) =>
              String(
                check.id
              ) ===
              String(normalized.id)
                ? updated
                : check
          )
      );

      // تحديث نافذة التفاصيل
      setOpenedCheck(
        updated
      );

      closeReturnForm();

      alert(
        "تم حفظ المرتجع داخل نفس الكشف بنجاح ✅"
      );

    } catch (err) {

      console.error(err);

      alert(
        "حدث خطأ أثناء حفظ المرتجع"
      );
    }
  };

  // ===================================================
  // حذف المرتجعات
  // ===================================================

  const deleteReturns = async (
    check
  ) => {

    const confirmed =
      window.confirm(
        "هل أنت متأكد من حذف جميع المرتجعات من هذا الكشف؟"
      );

    if (!confirmed) {
      return;
    }

    try {

      const normalized =
        normalizeCheck(check);

      const originalTotalUsd =
        calculateTotalUsd(
          normalized.items
        );

      const originalTotalSyp =
        calculateTotalSyp(
          normalized.items
        );

      const updatedCheck = {

        ...normalized,

        returnItems: [],

        returnNotes: "",

        netTotalUsd:
          Number(
            originalTotalUsd.toFixed(2)
          ),

        netTotalSyp:
          Number(
            originalTotalSyp.toFixed(0)
          ),
      };

      const response =
        await axios.put(
          `${API_URL}/${normalized.id}`,
          updatedCheck
        );

      const updated =
        normalizeCheck(
          response.data
        );

      setChecks(
        (prev) =>
          prev.map(
            (item) =>
              String(
                item.id
              ) ===
              String(normalized.id)
                ? updated
                : item
          )
      );

      setOpenedCheck(
        updated
      );

      alert(
        "تم حذف المرتجعات بنجاح"
      );

    } catch (err) {

      console.error(err);

      alert(
        "حدث خطأ أثناء حذف المرتجعات"
      );
    }
  };

  // ===================================================
  // الفلترة
  // ===================================================

  const filteredChecks =
    checks.filter(
      (check) => {

        const type =
          getCheckTypeValue(
            check.type
          );

        if (
          filterType ===
          "all"
        ) {
          return true;
        }

        if (
          filterType ===
            "sale" &&
          type === "بيع"
        ) {
          return true;
        }

        if (
          filterType ===
            "purchase" &&
          type === "شراء"
        ) {
          return true;
        }

        return false;
      }
    );

  // ===================================================
  // الكشوف حسب النوع
  // ===================================================

  const saleChecks =
    checks.filter(
      (check) =>
        getCheckTypeValue(
          check.type
        ) === "بيع"
    );

  const purchaseChecks =
    checks.filter(
      (check) =>
        getCheckTypeValue(
          check.type
        ) === "شراء"
    );

  // ===================================================
  // إجمالي البيع الصافي
  // ===================================================

  const totalSalesUsd =
    saleChecks.reduce(
      (total, check) =>
        total +
        calculateNetTotalUsd(
          normalizeCheck(check)
        ),
      0
    );

  const totalSalesSyp =
    saleChecks.reduce(
      (total, check) =>
        total +
        calculateNetTotalSyp(
          normalizeCheck(check)
        ),
      0
    );

  // ===================================================
  // إجمالي الشراء الصافي
  // ===================================================

  const totalPurchasesUsd =
    purchaseChecks.reduce(
      (total, check) =>
        total +
        calculateNetTotalUsd(
          normalizeCheck(check)
        ),
      0
    );

  const totalPurchasesSyp =
    purchaseChecks.reduce(
      (total, check) =>
        total +
        calculateNetTotalSyp(
          normalizeCheck(check)
        ),
      0
    );

  // ===================================================
  // إجمالي المرتجعات
  // ===================================================

  const totalReturnsUsd =
    checks.reduce(
      (total, check) =>
        total +
        calculateReturnTotalUsd(
          normalizeCheck(check)
        ),
      0
    );

  const totalReturnsSyp =
    checks.reduce(
      (total, check) =>
        total +
        calculateReturnTotalSyp(
          normalizeCheck(check)
        ),
      0
    );

  // ===================================================
  // الزبائن
  // ===================================================

  const customers =
    Array.from(
      new Set(
        filteredChecks
          .map(
            (check) =>
              check.customerName?.trim()
          )
          .filter(Boolean)
      )
    );

  // ===================================================
  // كشوف الزبون
  // ===================================================

  const getCustomerChecks = (
    customerName
  ) => {

    return filteredChecks.filter(
      (check) =>
        String(
          check.customerName ||
            ""
        ).trim() ===
        String(
          customerName
        ).trim()
    );
  };

  // ===================================================
  // إقامة الزبون
  // ===================================================

  const getCustomerResidence = (
    customerName
  ) => {

    const check =
      checks.find(
        (item) =>
          String(
            item.customerName ||
              ""
          ).trim() ===
            String(
              customerName
            ).trim()
      );

    return (
      check?.residence ||
      ""
    );
  };

  // ===================================================
  // هاتف الزبون
  // ===================================================

  const getCustomerPhone = (
    customerName
  ) => {

    const check =
      checks.find(
        (item) =>
          String(
            item.customerName ||
              ""
          ).trim() ===
            String(
              customerName
            ).trim() &&
          item.phone
      );

    return (
      check?.phone ||
      ""
    );
  };

  // ===================================================
  // فتح كشف
  // ===================================================

  const openCheck = (
    check
  ) => {

    setOpenedCheck(
      normalizeCheck(check)
    );
  };

  // ===================================================
  // JSX
  // ===================================================

  return (
    <div className="checks-page">

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
            الكشوف
          </Link>

          <Link to="/dashboard">
            الداشبورد
          </Link>

        </div>

      </nav>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="checks-container">

        {/* HEADER */}

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

        {/* ERROR */}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* FILTER */}

        <div className="checks-filter">

          <span>
            فلترة الكشوف:
          </span>

          <button
            className={`filter-btn ${
              filterType ===
              "all"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilterType(
                "all"
              )
            }
          >
            الكل
          </button>

          <button
            className={`filter-btn ${
              filterType ===
              "sale"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilterType(
                "sale"
              )
            }
          >
            كشوف البيع
          </button>

          <button
            className={`filter-btn ${
              filterType ===
              "purchase"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilterType(
                "purchase"
              )
            }
          >
            كشوف الشراء
          </button>

        </div>

        {/* SUMMARY */}

        {!loading && (
          <div className="checks-total-summary">

            {/* البيع */}

            <div className="summary-box sale-summary">

              <div className="summary-box-header">

                <span>
                  💰
                </span>

                <h3>
                  إجمالي كشوف البيع
                </h3>

              </div>

              <div className="summary-values">

                <div className="summary-value">

                  <span>
                    الصافي بالدولار
                  </span>

                  <strong>
                    $
                    {" "}
                    {formatNumber(
                      totalSalesUsd.toFixed(
                        2
                      )
                    )}
                  </strong>

                </div>

                <div className="summary-value">

                  <span>
                    الصافي بالسوري
                  </span>

                  <strong>
                    {formatNumber(
                      totalSalesSyp.toFixed(
                        0
                      )
                    )}
                    {" "}
                    ل.س
                  </strong>

                </div>

              </div>

              <small>
                عدد الكشوف:{" "}
                {saleChecks.length}
              </small>

            </div>

            {/* الشراء */}

            <div className="summary-box purchase-summary">

              <div className="summary-box-header">

                <span>
                  🛒
                </span>

                <h3>
                  إجمالي كشوف الشراء
                </h3>

              </div>

              <div className="summary-values">

                <div className="summary-value">

                  <span>
                    الصافي بالدولار
                  </span>

                  <strong>
                    $
                    {" "}
                    {formatNumber(
                      totalPurchasesUsd.toFixed(
                        2
                      )
                    )}
                  </strong>

                </div>

                <div className="summary-value">

                  <span>
                    الصافي بالسوري
                  </span>

                  <strong>
                    {formatNumber(
                      totalPurchasesSyp.toFixed(
                        0
                      )
                    )}
                    {" "}
                    ل.س
                  </strong>

                </div>

              </div>

              <small>
                عدد الكشوف:{" "}
                {purchaseChecks.length}
              </small>

            </div>

            {/* المرتجعات */}

            <div className="summary-box return-summary">

              <div className="summary-box-header">

                <span>
                  ↩️
                </span>

                <h3>
                  إجمالي المرتجعات
                </h3>

              </div>

              <div className="summary-values">

                <div className="summary-value">

                  <span>
                    بالدولار
                  </span>

                  <strong>
                    $
                    {" "}
                    {formatNumber(
                      totalReturnsUsd.toFixed(
                        2
                      )
                    )}
                  </strong>

                </div>

                <div className="summary-value">

                  <span>
                    بالسوري
                  </span>

                  <strong>
                    {formatNumber(
                      totalReturnsSyp.toFixed(
                        0
                      )
                    )}
                    {" "}
                    ل.س
                  </strong>

                </div>

              </div>

              <small>
                المرتجعات ضمن الكشوف
              </small>

            </div>

          </div>
        )}

        {/* RESULT */}

        {!loading && (
          <div className="filter-result-info">

            {filterType ===
              "all" && (
              <>
                جميع الكشوف:{" "}
                <strong>
                  {
                    filteredChecks.length
                  }
                </strong>
              </>
            )}

            {filterType ===
              "sale" && (
              <>
                كشوف البيع:{" "}
                <strong>
                  {
                    filteredChecks.length
                  }
                </strong>
              </>
            )}

            {filterType ===
              "purchase" && (
              <>
                كشوف الشراء:{" "}
                <strong>
                  {
                    filteredChecks.length
                  }
                </strong>
              </>
            )}

          </div>
        )}

        {/* LOADING */}

        {loading ? (

          <div className="loading">
            جاري تحميل الكشوف...
          </div>

        ) : customers.length ===
          0 ? (

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

                const customerTotalUsd =
                  customerChecks.reduce(
                    (total, check) =>
                      total +
                      calculateNetTotalUsd(
                        normalizeCheck(
                          check
                        )
                      ),
                    0
                  );

                const customerTotalSyp =
                  customerChecks.reduce(
                    (total, check) =>
                      total +
                      calculateNetTotalSyp(
                        normalizeCheck(
                          check
                        )
                      ),
                    0
                  );

                return (

                  <div
                    className="customer-section"
                    key={customerName}
                  >

                    {/* CUSTOMER HEADER */}

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
                              📍{" "}
                              {residence}
                            </p>
                          )}

                          {phone && (
                            <p className="customer-residence">
                              📞{" "}
                              {phone}
                            </p>
                          )}

                          <span>
                            {
                              customerChecks.length
                            }{" "}
                            كشف
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
                      >
                        +
                      </button>

                    </div>

                    {/* CUSTOMER TOTAL */}

                    <div className="customer-total-box">

                      <div className="customer-total-title">
                        صافي إجمالي كشوف الزبون
                      </div>

                      <div className="customer-total-values">

                        <div className="customer-total-item usd-total">

                          <span>
                            بالدولار
                          </span>

                          <strong>
                            $
                            {" "}
                            {formatNumber(
                              customerTotalUsd.toFixed(
                                2
                              )
                            )}
                          </strong>

                        </div>

                        <div className="customer-total-item syp-total">

                          <span>
                            بالسوري
                          </span>

                          <strong>
                            {formatNumber(
                              customerTotalSyp.toFixed(
                                0
                              )
                            )}
                            {" "}
                            ل.س
                          </strong>

                        </div>

                      </div>

                    </div>

                    {/* CHECKS */}

                    <div className="customer-checks-grid">

                      {customerChecks.map(
                        (check) => {

                          const normalized =
                            normalizeCheck(
                              check
                            );

                          const totalUsd =
                            calculateTotalUsd(
                              normalized.items
                            );

                          const totalSyp =
                            calculateTotalSyp(
                              normalized.items
                            );

                          const returnUsd =
                            calculateReturnTotalUsd(
                              normalized
                            );

                          const returnSyp =
                            calculateReturnTotalSyp(
                              normalized
                            );

                          const netUsd =
                            calculateNetTotalUsd(
                              normalized
                            );

                          const netSyp =
                            calculateNetTotalSyp(
                              normalized
                            );

                          return (

                            <div
                              className="check-card"
                              key={
                                check.id
                              }
                            >

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
                                    getCheckTypeValue(
                                      check.type
                                    ) ===
                                    "شراء"
                                      ? "purchase"
                                      : "sale"
                                  }`}
                                >
                                  {
                                    getCheckTypeValue(
                                      check.type
                                    )
                                  }
                                </span>

                              </div>

                              {/* PAYMENT */}

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
                                  {
                                    check.paymentStatus ||
                                    getDefaultPaymentStatus(
                                      check.type
                                    )
                                  }
                                </strong>

                              </div>

                              {/* DATE */}

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
                                    {
                                      check.exchangeRate
                                        ? formatNumber(
                                            check.exchangeRate
                                          )
                                        : "-"
                                    }
                                    {" "}
                                    ل.س
                                  </strong>

                                </div>

                              </div>

                              {/* ORIGINAL TOTAL */}

                              <div className="check-amount">

                                <div>

                                  <span>
                                    إجمالي الكشف
                                  </span>

                                  <strong>
                                    $
                                    {" "}
                                    {formatNumber(
                                      totalUsd.toFixed(
                                        2
                                      )
                                    )}
                                  </strong>

                                </div>

                                <div>

                                  <span>
                                    بالسوري
                                  </span>

                                  <strong>
                                    {formatNumber(
                                      totalSyp.toFixed(
                                        0
                                      )
                                    )}
                                    {" "}
                                    ل.س
                                  </strong>

                                </div>

                              </div>

                              {/* RETURN */}

                              {returnUsd >
                                0 && (

                                <div className="return-reference">

                                  ↩️ المرتجع ضمن الكشف:

                                  <strong>
                                    {" "}
                                    $
                                    {" "}
                                    {formatNumber(
                                      returnUsd.toFixed(
                                        2
                                      )
                                    )}
                                  </strong>

                                  {" "}
                                  /{" "}

                                  <strong>
                                    {formatNumber(
                                      returnSyp.toFixed(
                                        0
                                      )
                                    )}
                                    {" "}
                                    ل.س
                                  </strong>

                                </div>

                              )}

                              {/* NET */}

                              <div className="check-amount">

                                <div>

                                  <span>
                                    صافي الكشف
                                  </span>

                                  <strong>
                                    $
                                    {" "}
                                    {formatNumber(
                                      netUsd.toFixed(
                                        2
                                      )
                                    )}
                                  </strong>

                                </div>

                                <div>

                                  <span>
                                    الصافي بالسوري
                                  </span>

                                  <strong>
                                    {formatNumber(
                                      netSyp.toFixed(
                                        0
                                      )
                                    )}
                                    {" "}
                                    ل.س
                                  </strong>

                                </div>

                              </div>

                              {/* ITEMS */}

                              <div className="card-products">

                                {normalized.items
                                  ?.slice(
                                    0,
                                    2
                                  )
                                  .map(
                                    (
                                      item,
                                      index
                                    ) => (

                                      <div
                                        className="card-product-row"
                                        key={
                                          index
                                        }
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

                              {/* ACTIONS */}

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
                                  className="return-btn"
                                  onClick={() =>
                                    openReturnForm(
                                      check
                                    )
                                  }
                                >
                                  ↩️ مرتجع
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

                      {/* NEW CHECK */}

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

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showAddForm && (
        <CheckForm
          formData={
            formData
          }
          handleChange={
            handleChange
          }
          handleItemChange={
            handleItemChange
          }
          addItem={
            addItem
          }
          removeItem={
            removeItem
          }
          handleSubmit={
            editId
              ? handleUpdate
              : handleAdd
          }
          closeForm={
            closeForm
          }
          editMode={
            !!editId
          }
          selectedCustomer={
            selectedCustomer
          }
        />
      )}

      {/* =================================================
          RETURN MODAL
      ================================================= */}

      {returnCheck && (

        <div className="modal-overlay">

          <div className="modal check-form-modal return-modal">

            {/* HEADER */}

            <div className="modal-header">

              <div>

                <h2>
                  ↩️ مرتجع من الكشف #
                  {
                    returnCheck.checkNumber ||
                    "-"
                  }
                </h2>

                <small>
                  المرتجع سيُحفظ داخل نفس الكشف
                </small>

              </div>

              <button
                type="button"
                className="close-modal"
                onClick={
                  closeReturnForm
                }
              >
                ×
              </button>

            </div>

            <form
              className="check-form"
              onSubmit={
                handleReturnSubmit
              }
            >

              {/* INFO */}

              <div className="return-info-box">

                <div>

                  <strong>
                    الزبون:
                  </strong>

                  <span>
                    {
                      returnCheck.customerName ||
                      "-"
                    }
                  </span>

                </div>

                <div>

                  <strong>
                    رقم الكشف:
                  </strong>

                  <span>
                    #
                    {
                      returnCheck.checkNumber ||
                      "-"
                    }
                  </span>

                </div>

                <div>

                  <strong>
                    نوع الكشف:
                  </strong>

                  <span>
                    {
                      getCheckTypeValue(
                        returnCheck.type
                      )
                    }
                  </span>

                </div>

              </div>

              {/* ========================================
                  MATERIALS
              ======================================== */}

              <div className="form-section-title">
                مواد الكشف
              </div>

              <div className="return-warning">
                ⚠️ المواد والمواصفات والأسعار جلبناها تلقائيًا من الكشف الأصلي. حددي فقط الكمية المرتجعة.
              </div>

              <div className="return-items-container">

                {returnItems.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      className="return-item-box"
                      key={index}
                    >

                      {/* عنوان */}

                      <div className="return-item-header">

                        <div>

                          <strong>
                            {index + 1}.{" "}
                            {
                              item.productType
                            }
                          </strong>

                          <small>
                            {
                              item.specifications ||
                              "بدون مواصفات"
                            }
                          </small>

                        </div>

                      </div>

                      {/* المعلومات */}

                      <div className="return-item-info-grid">

                        <div className="return-info-field">

                          <span>
                            نوع المادة
                          </span>

                          <strong>
                            {
                              item.productType ||
                              "-"
                            }
                          </strong>

                        </div>

                        <div className="return-info-field">

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

                        <div className="return-info-field">

                          <span>
                            السعر بالدولار
                          </span>

                          <strong>
                            $
                            {" "}
                            {formatNumber(
                              item.priceUsd
                            )}
                          </strong>

                        </div>

                        <div className="return-info-field">

                          <span>
                            السعر بالسوري
                          </span>

                          <strong>
                            {formatNumber(
                              item.priceSyp
                            )}
                            {" "}
                            ل.س
                          </strong>

                        </div>

                        <div className="return-info-field">

                          <span>
                            الكمية الأصلية
                          </span>

                          <strong>
                            {formatNumber(
                              item.originalQuantity
                            )}
                          </strong>

                        </div>

                        <div className="return-info-field">

                          <span>
                            المرتجع سابقًا
                          </span>

                          <strong>
                            {formatNumber(
                              item.returnedQuantity
                            )}
                          </strong>

                        </div>

                        <div className="return-info-field remaining-field">

                          <span>
                            الكمية المتبقية
                          </span>

                          <strong>
                            {formatNumber(
                              item.remainingQuantity
                            )}
                          </strong>

                        </div>

                      </div>

                      {/* الكمية المرتجعة */}

                      <div className="return-quantity-input">

                        <label>
                          الكمية التي تريدين إرجاعها
                        </label>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            item.quantity
                          }
                          onChange={(e) =>
                            handleReturnQuantityChange(
                              index,
                              e.target.value
                            )
                          }
                          placeholder={
                            item.remainingQuantity >
                            0
                              ? `حد أقصى ${formatNumber(
                                  item.remainingQuantity
                                )}`
                              : "لا توجد كمية متبقية"
                          }
                          disabled={
                            item.remainingQuantity <=
                            0
                          }
                        />

                        {item.remainingQuantity <=
                          0 && (
                          <small>
                            تم إرجاع كامل كمية هذه المادة
                          </small>
                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

              {/* ========================================
                  TOTALS
              ======================================== */}

              <div className="customer-total-box">

                <div className="customer-total-title">
                  قيمة المرتجع الحالي
                </div>

                <div className="customer-total-values">

                  <div className="customer-total-item usd-total">

                    <span>
                      بالدولار
                    </span>

                    <strong>
                      $
                      {" "}
                      {formatNumber(
                        calculateTotalUsd(
                          returnItems
                        ).toFixed(2)
                      )}
                    </strong>

                  </div>

                  <div className="customer-total-item syp-total">

                    <span>
                      بالسوري
                    </span>

                    <strong>
                      {formatNumber(
                        calculateTotalSyp(
                          returnItems
                        ).toFixed(0)
                      )}
                      {" "}
                      ل.س
                    </strong>

                  </div>

                </div>

              </div>

              {/* ========================================
                  ORIGINAL / PREVIOUS / NET
              ======================================== */}

              <div className="return-summary-box">

                <div>

                  <span>
                    إجمالي الكشف الأصلي
                  </span>

                  <strong>
                    $
                    {" "}
                    {formatNumber(
                      calculateTotalUsd(
                        returnCheck.items
                      ).toFixed(2)
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    المرتجع السابق
                  </span>

                  <strong>
                    $
                    {" "}
                    {formatNumber(
                      calculateReturnTotalUsd(
                        returnCheck
                      ).toFixed(2)
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    المرتجع الحالي
                  </span>

                  <strong>
                    $
                    {" "}
                    {formatNumber(
                      calculateTotalUsd(
                        returnItems
                      ).toFixed(2)
                    )}
                  </strong>

                </div>

                <div className="net-return-result">

                  <span>
                    الصافي بعد المرتجع
                  </span>

                  <strong>
                    $
                    {" "}
                    {formatNumber(
                      Math.max(
                        0,
                        calculateTotalUsd(
                          returnCheck.items
                        ) -
                          calculateReturnTotalUsd(
                            returnCheck
                          ) -
                          calculateTotalUsd(
                            returnItems
                          )
                      ).toFixed(2)
                    )}
                  </strong>

                </div>

              </div>

              {/* NOTES */}

              <div className="form-section-title">
                ملاحظات المرتجع
              </div>

              <div className="form-group full-width">

                <textarea
                  value={
                    returnNotes
                  }
                  onChange={(e) =>
                    setReturnNotes(
                      e.target.value
                    )
                  }
                  placeholder="أدخل ملاحظات المرتجع..."
                />

              </div>

              {/* ACTIONS */}

              <div className="form-actions">

                <button
                  type="submit"
                  className="btn btn-return"
                >
                  ↩️ حفظ المرتجع
                </button>

                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={
                    closeReturnForm
                  }
                >
                  إلغاء
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =================================================
          VIEW MODAL
      ================================================= */}

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
                    getCheckTypeValue(
                      openedCheck.type
                    )
                  }
                </span>

              </div>

              <button
                type="button"
                className="close-modal"
                onClick={() =>
                  setOpenedCheck(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="check-view">

              {/* المعلومات */}

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
                    getCheckTypeValue(
                      openedCheck.type
                    )
                  }
                </strong>

              </div>

              <div className="view-row">

                <span>
                  حالة الدفع
                </span>

                <strong>
                  {
                    openedCheck.paymentStatus ||
                    "-"
                  }
                </strong>

              </div>

              <div className="view-row">

                <span>
                  سعر الدولار
                </span>

                <strong>
                  {
                    openedCheck.exchangeRate
                      ? formatNumber(
                          openedCheck.exchangeRate
                        )
                      : "-"
                  }
                  {" "}
                  ل.س
                </strong>

              </div>

              {/* ========================================
                  المواد الأصلية
              ======================================== */}

              <div className="view-items">

                <h3>
                  مواد الكشف
                </h3>

                {openedCheck.items.map(
                  (
                    item,
                    index
                  ) => (

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
                            {formatNumber(
                              item.quantity
                            )}
                          </strong>

                        </div>

                        <div>

                          <span>
                            السعر بالدولار
                          </span>

                          <strong>
                            $
                            {" "}
                            {formatNumber(
                              item.priceUsd
                            )}
                          </strong>

                        </div>

                        <div>

                          <span>
                            السعر بالسوري
                          </span>

                          <strong>
                            {formatNumber(
                              item.priceSyp
                            )}
                            {" "}
                            ل.س
                          </strong>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

              {/* ========================================
                  المرتجعات
              ======================================== */}

              {openedCheck.returnItems?.length >
                0 && (

                <div className="view-items">

                  <h3>
                    ↩️ المواد المرتجعة
                  </h3>

                  {openedCheck.returnItems.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        className="view-item return-view-item"
                        key={index}
                      >

                        <div className="view-item-header">

                          <strong>
                            مرتجع{" "}
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
                              الكمية المرتجعة
                            </span>

                            <strong>
                              {formatNumber(
                                item.quantity
                              )}
                            </strong>

                          </div>

                          <div>

                            <span>
                              قيمة المرتجع بالدولار
                            </span>

                            <strong>
                              $
                              {" "}
                              {formatNumber(
                                (
                                  toNumber(
                                    item.quantity
                                  ) *
                                  toNumber(
                                    item.priceUsd
                                  )
                                ).toFixed(2)
                              )}
                            </strong>

                          </div>

                          <div>

                            <span>
                              قيمة المرتجع بالسوري
                            </span>

                            <strong>
                              {formatNumber(
                                (
                                  toNumber(
                                    item.quantity
                                  ) *
                                  toNumber(
                                    item.priceSyp
                                  )
                                ).toFixed(0)
                              )}
                              {" "}
                              ل.س
                            </strong>

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

              {/* ========================================
                  TOTALS
              ======================================== */}

              <div className="view-total">

                <div>

                  <span>
                    إجمالي الكشف الأصلي
                  </span>

                  <strong>
                    $
                    {" "}
                    {formatNumber(
                      calculateTotalUsd(
                        openedCheck.items
                      ).toFixed(2)
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    بالسوري
                  </span>

                  <strong>
                    {formatNumber(
                      calculateTotalSyp(
                        openedCheck.items
                      ).toFixed(0)
                    )}
                    {" "}
                    ل.س
                  </strong>

                </div>

              </div>

              {openedCheck.returnItems?.length >
                0 && (

                <div className="view-total return-total-view">

                  <div>

                    <span>
                      إجمالي المرتجع
                    </span>

                    <strong>
                      $
                      {" "}
                      {formatNumber(
                        calculateReturnTotalUsd(
                          openedCheck
                        ).toFixed(2)
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      إجمالي المرتجع بالسوري
                    </span>

                    <strong>
                      {formatNumber(
                        calculateReturnTotalSyp(
                          openedCheck
                        ).toFixed(0)
                      )}
                      {" "}
                      ل.س
                    </strong>

                  </div>

                </div>

              )}

              <div className="view-total">

                <div>

                  <span>
                    الصافي بعد المرتجع
                  </span>

                  <strong>
                    $
                    {" "}
                    {formatNumber(
                      calculateNetTotalUsd(
                        openedCheck
                      ).toFixed(2)
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    الصافي بالسوري
                  </span>

                  <strong>
                    {formatNumber(
                      calculateNetTotalSyp(
                        openedCheck
                      ).toFixed(0)
                    )}
                    {" "}
                    ل.س
                  </strong>

                </div>

              </div>

              {openedCheck.returnNotes && (
                <div className="view-row">

                  <span>
                    ملاحظات المرتجع
                  </span>

                  <strong>
                    {
                      openedCheck.returnNotes
                    }
                  </strong>

                </div>
              )}

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

            {/* ACTIONS */}

            <div className="view-actions">

              <button
                className="btn btn-return"
                onClick={() =>
                  openReturnForm(
                    openedCheck
                  )
                }
              >
                ↩️ إضافة مرتجع
              </button>

              {openedCheck.returnItems?.length >
                0 && (

                <button
                  className="btn btn-cancel"
                  onClick={() =>
                    deleteReturns(
                      openedCheck
                    )
                  }
                >
                  🗑 حذف المرتجعات
                </button>

              )}

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
                  setOpenedCheck(
                    null
                  )
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