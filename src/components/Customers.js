import { useEffect, useState } from "react";
import axios from "axios";
import "./Customers.css";
import { Link } from "react-router-dom";

const API = "https://abdbac2-10.onrender.com";

function Customers() {
  const [checks, setChecks] = useState([]);
  const [debts, setDebts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // توحيد الأسماء وتجاهل الفروق الشائعة في الكتابة العربية
  const normalizeName = (value) =>
    String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/ـ/g, "")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .toLowerCase();

  // توحيد أرقام الشيكات
  const normalizeNumber = (value) =>
    String(value ?? "").trim();

  // جلب البيانات
  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [checksRes, debtsRes] = await Promise.all([
        axios.get(`${API}/checks`),
        axios.get(`${API}/debts`)
      ]);

      const checksData = Array.isArray(checksRes.data)
        ? checksRes.data
        : [];

      const debtsData = Array.isArray(debtsRes.data)
        ? debtsRes.data
        : [];

      setChecks(checksData);
      setDebts(debtsData);

      console.log("CHECKS DATA:", checksData);
      console.log("DEBTS DATA:", debtsData);
    } catch (err) {
      console.error("Error loading customers:", err);
      setError("حدث خطأ أثناء تحميل بيانات الزبائن");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // التحقق هل الدين يخص زبوناً
  const isValidCustomerDebtType = (debt) => {
    const type = normalizeName(debt.debtType);
    return !type || ["customer", "زبون", "عميل", "بيع"].includes(type);
  };

  // البحث عن الكشف المرتبط بالدين
  const getRelatedCheck = (debt) => {
    return checks.find((check) => {
      const debtCheckId = String(
        debt.checkId ||
        debt.returnForCheckId ||
        ""
      );

      const debtCheckNumber = normalizeNumber(
        debt.checkNumber ||
        debt.returnForCheckNumber
      );

      const sameId =
        debtCheckId &&
        (
          String(check.id) === debtCheckId ||
          String(check.returnForCheckId || "") === debtCheckId
        );

      const sameNumber =
        debtCheckNumber &&
        (
          normalizeNumber(check.checkNumber) === debtCheckNumber ||
          normalizeNumber(check.returnForCheckNumber) === debtCheckNumber
        );

      return Boolean(sameId || sameNumber);
    });
  };

  // استخراج اسم الزبون بإعطاء الأولوية للاسم المباشر في سجل الدين
  const getCustomerNameForDebt = (debt) => {
    const directName =
      debt.customerName ||
      debt.personName ||
      debt.name;

    if (directName && String(directName).trim()) {
      return directName;
    }

    const relatedCheck = getRelatedCheck(debt);
    return relatedCheck?.customerName || "";
  };

  // إنشاء قائمة الزبائن من الكشوف والديون الخاصة بالزبائن
  const allCustomers = [
    ...checks.map((check) => ({
      name: check.customerName,
      phone: check.phone,
      residence: check.residence
    })),

    ...debts
      .filter(isValidCustomerDebtType)
      .map((debt) => {
        const relatedCheck = getRelatedCheck(debt);

        return {
          name: getCustomerNameForDebt(debt),
          phone: debt.phone || relatedCheck?.phone || "",
          residence: debt.residence || relatedCheck?.residence || ""
        };
      })
  ];

  // إزالة التكرار والبحث حسب الاسم الموحد
  const customers = [
    ...new Map(
      allCustomers
        .filter((customer) => customer.name?.trim())
        .map((customer) => [
          normalizeName(customer.name),
          customer
        ])
    ).values()
  ].filter((customer) =>
    normalizeName(customer.name).includes(
      normalizeName(search)
    )
  );

  // كشوف الزبون المحدد
  const customerChecks = selectedCustomer
    ? checks.filter(
        (check) =>
          normalizeName(check.customerName) ===
          normalizeName(selectedCustomer.name)
      )
    : [];

  // تحديد الديون التابعة للزبون المحدد
  const isCustomerDebt = (debt) => {
    if (!isValidCustomerDebtType(debt)) return false;

    const selectedName = normalizeName(selectedCustomer?.name);
    const debtName = normalizeName(getCustomerNameForDebt(debt));

    if (!selectedName || !debtName) return false;

    return (
      debtName === selectedName ||
      (selectedName.length >= 4 && debtName.includes(selectedName)) ||
      (debtName.length >= 4 && selectedName.includes(debtName))
    );
  };

  const customerDebts = selectedCustomer
    ? debts.filter(isCustomerDebt)
    : [];

  // إجمالي الكشوف حسب النوع
  const total = (key, type) =>
    customerChecks
      .filter((check) => check.type === type)
      .reduce(
        (sum, check) => sum + Number(check[key] || 0),
        0
      );

  // تنسيق الأرقام
  const format = (value) =>
    Number(value || 0).toLocaleString("en-US");

  // إجمالي الديون
  const totalDebtUsd = customerDebts.reduce(
    (sum, debt) => sum + Number(debt.amountUsd || 0),
    0
  );

  const totalDebtSyp = customerDebts.reduce(
    (sum, debt) => sum + Number(debt.amountSyp || 0),
    0
  );

  if (loading) {
    return (
      <div className="customers-loading">
        جاري تحميل الزبائن...
      </div>
    );
  }

  return (
    <div className="customers-page" dir="rtl">
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

      <div className="customers-header">
        <h2>حسابات الزبائن</h2>

        {selectedCustomer && (
          <button
            className="back-btn"
            onClick={() => setSelectedCustomer(null)}
          >
            رجوع إلى الزبائن
          </button>
        )}
      </div>

      {error && (
        <div className="customers-error">
          {error}
          <button onClick={fetchData}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {!selectedCustomer ? (
        <>
          <input
            className="customer-search"
            placeholder="ابحث عن زبون..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="customers-grid">
            {customers.map((customer) => (
              <div
                className="customer-card"
                key={normalizeName(customer.name)}
                onClick={() => setSelectedCustomer(customer)}
              >
                <h3>{customer.name}</h3>

                <p>
                  📞 {customer.phone || "غير مسجل"}
                </p>

                <p>
                  📍 {customer.residence || "غير مسجل"}
                </p>

                <span>عرض الحساب ←</span>
              </div>
            ))}

            {customers.length === 0 && (
              <p className="empty-account">
                لا يوجد زبائن
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="customer-profile">
            <h2>{selectedCustomer.name}</h2>

            <p>
              رقم الهاتف: {selectedCustomer.phone || "—"}
            </p>

            <p>
              العنوان: {selectedCustomer.residence || "—"}
            </p>
          </div>

          <h3 className="section-title">
            ملخص الحساب
          </h3>

          <div className="customer-stats">
            <div className="customer-stat">
              <span>إجمالي البيع</span>
              <strong>
                {format(total("totalAmountUsd", "بيع"))} $
              </strong>
              <strong>
                {format(total("totalAmountSyp", "بيع"))} ل.س
              </strong>
            </div>

            <div className="customer-stat">
              <span>إجمالي الشراء</span>
              <strong>
                {format(total("totalAmountUsd", "شراء"))} $
              </strong>
              <strong>
                {format(total("totalAmountSyp", "شراء"))} ل.س
              </strong>
            </div>

            <div className="customer-stat">
              <span>المرتجعات</span>
              <strong>
                {format(total("totalAmountUsd", "مرتجع"))} $
              </strong>
              <strong>
                {format(total("totalAmountSyp", "مرتجع"))} ل.س
              </strong>
            </div>

            <div className="customer-stat debt-total">
              <span>الديون المسجلة</span>
              <strong>
                {format(totalDebtUsd)} $
              </strong>
              <strong>
                {format(totalDebtSyp)} ل.س
              </strong>
            </div>
          </div>

          <h3 className="section-title">
            الكشوف والمرتجعات
          </h3>

          {/* جدول الكمبيوتر */}
          <div className="customer-table-container desktop-table">
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>رقم الشيك</th>
                  <th>النوع</th>
                  <th>المبلغ بالدولار</th>
                  <th>المبلغ بالليرة</th>
                  <th>حالة الدفع</th>
                </tr>
              </thead>

              <tbody>
                {customerChecks.length > 0 ? (
                  customerChecks.map((check) => (
                    <tr key={check.id}>
                      <td>{check.date || "—"}</td>
                      <td>{check.checkNumber || "—"}</td>
                      <td>{check.type || "—"}</td>
                      <td>
                        {format(
                          check.netTotalUsd ??
                          check.totalAmountUsd
                        )} $
                      </td>
                      <td>
                        {format(
                          check.netTotalSyp ??
                          check.totalAmountSyp
                        )} ل.س
                      </td>
                      <td>{check.paymentStatus || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">لا توجد كشوف</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* كروت الموبايل للكشوف */}
          <div className="mobile-cards">
            {customerChecks.length > 0 ? (
              customerChecks.map((check) => (
                <div className="account-card" key={check.id}>
                  <div className="account-card-header">
                    <strong>
                      كشف رقم {check.checkNumber || "—"}
                    </strong>

                    <span
                      className={`type-badge ${
                        check.type === "مرتجع"
                          ? "return-badge"
                          : ""
                      }`}
                    >
                      {check.type || "—"}
                    </span>
                  </div>

                  <div className="account-card-row">
                    <span>التاريخ</span>
                    <strong>{check.date || "—"}</strong>
                  </div>

                  <div className="account-card-row">
                    <span>المبلغ بالدولار</span>
                    <strong>
                      {format(
                        check.netTotalUsd ??
                        check.totalAmountUsd
                      )} $
                    </strong>
                  </div>

                  <div className="account-card-row">
                    <span>المبلغ بالليرة</span>
                    <strong>
                      {format(
                        check.netTotalSyp ??
                        check.totalAmountSyp
                      )} ل.س
                    </strong>
                  </div>

                  <div className="account-card-row">
                    <span>حالة الدفع</span>
                    <strong>
                      {check.paymentStatus || "—"}
                    </strong>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-account">لا توجد كشوف</p>
            )}
          </div>

          <h3 className="section-title">الديون</h3>

          {/* جدول الكمبيوتر */}
          <div className="customer-table-container desktop-table">
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>رقم الشيك</th>
                  <th>الدولار</th>
                  <th>الليرة السورية</th>
                </tr>
              </thead>

              <tbody>
                {customerDebts.length > 0 ? (
                  customerDebts.map((debt) => (
                    <tr key={debt.id}>
                      <td>{debt.date || "—"}</td>
                      <td>{debt.checkNumber || "—"}</td>
                      <td>{format(debt.amountUsd)} $</td>
                      <td>{format(debt.amountSyp)} ل.س</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      لا توجد ديون مسجلة لهذا الزبون
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* كروت الموبايل للديون */}
          <div className="mobile-cards">
            {customerDebts.length > 0 ? (
              customerDebts.map((debt) => (
                <div
                  className="account-card debt-card"
                  key={debt.id}
                >
                  <div className="account-card-header">
                    <strong>
                      دين رقم {debt.checkNumber || "—"}
                    </strong>

                    <span className="type-badge debt-badge">
                      دين
                    </span>
                  </div>

                  <div className="account-card-row">
                    <span>التاريخ</span>
                    <strong>{debt.date || "—"}</strong>
                  </div>

                  <div className="account-card-row">
                    <span>المبلغ بالدولار</span>
                    <strong>
                      {format(debt.amountUsd)} $
                    </strong>
                  </div>

                  <div className="account-card-row">
                    <span>المبلغ بالليرة</span>
                    <strong>
                      {format(debt.amountSyp)} ل.س
                    </strong>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-account">
                لا توجد ديون مسجلة لهذا الزبون
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Customers;