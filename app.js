// ========== GST Calculator Pro ==========
// All data saved in localStorage

const DEFAULT_SETTINGS = {
  shopName: "My Phone Store",
  gstin: "",
  address: "",
  phone: ""
};

// ---------- Utility ----------
function formatINR(num) {
  return "₹" + Number(num).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function getToday() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function generateInvoiceNo() {
  const now = new Date();
  const str = now.getFullYear().toString().slice(-2) +
              String(now.getMonth() + 1).padStart(2, "0") +
              String(now.getDate()).padStart(2, "0") +
              String(now.getHours()).padStart(2, "0") +
              String(now.getMinutes()).padStart(2, "0");
  return "INV-" + str;
}

// ---------- Settings ----------
function loadSettings() {
  const saved = localStorage.getItem("gstProSettings");
  if (saved) {
    return JSON.parse(saved);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  localStorage.setItem("gstProSettings", JSON.stringify(settings));
}

function applySettingsToUI() {
  const s = loadSettings();
  document.getElementById("shopName").value = s.shopName || "";
  document.getElementById("gstin").value = s.gstin || "";
  document.getElementById("shopAddress").value = s.address || "";
  document.getElementById("shopPhone").value = s.phone || "";

  // Also update bill header immediately
  updateBillHeader(s);
}

function updateBillHeader(s) {
  document.getElementById("billShopName").textContent = s.shopName || "Your Shop Name";
  document.getElementById("billShopAddress").textContent = s.address || "Shop Address";
  document.getElementById("billShopPhone").textContent = s.phone ? "📞 " + s.phone : "Phone";
  document.getElementById("billGstin").textContent = s.gstin || "Not Set";
}

// ---------- Calculator ----------
let lastResult = null;

function calculate() {
  const amount = parseFloat(document.getElementById("amount").value) || 0;
  const rateSelect = document.getElementById("rate").value;
  let rate = rateSelect === "custom"
    ? parseFloat(document.getElementById("customRate").value) || 0
    : parseFloat(rateSelect);

  const calcType = document.getElementById("calcType").value;
  const supplyType = document.getElementById("supplyType").value;

  let taxable, gstAmount, total;

  if (calcType === "add") {
    // Exclusive: Add GST
    taxable = amount;
    gstAmount = amount * (rate / 100);
    total = amount + gstAmount;
  } else {
    // Inclusive: Remove GST
    total = amount;
    taxable = amount * 100 / (100 + rate);
    gstAmount = amount - taxable;
  }

  let cgst = 0, sgst = 0, igst = 0;

  if (supplyType === "intra") {
    cgst = gstAmount / 2;
    sgst = gstAmount / 2;
  } else {
    igst = gstAmount;
  }

  // Update UI
  document.getElementById("taxable").textContent = formatINR(taxable);
  document.getElementById("cgst").textContent = formatINR(cgst);
  document.getElementById("sgst").textContent = formatINR(sgst);
  document.getElementById("igst").textContent = formatINR(igst);
  document.getElementById("totalGst").textContent = formatINR(gstAmount);
  document.getElementById("grandTotal").textContent = formatINR(total);

  document.getElementById("resultBox").classList.remove("hidden");

  lastResult = {
    taxable,
    cgst,
    sgst,
    igst,
    gstAmount,
    total,
    rate,
    supplyType
  };

  return lastResult;
}

// ---------- Bill Generation ----------
function generateBill() {
  if (!lastResult) {
    calculate();
  }

  const r = lastResult;
  const settings = loadSettings();

  // Auto invoice if empty
  let invNo = document.getElementById("invoiceNo").value.trim();
  if (!invNo) {
    invNo = generateInvoiceNo();
    document.getElementById("invoiceNo").value = invNo;
  }

  let invDate = document.getElementById("invoiceDate").value;
  if (!invDate) {
    invDate = getToday();
    document.getElementById("invoiceDate").value = invDate;
  }

  const customer = document.getElementById("customerName").value.trim() || "Cash Customer";
  const itemDesc = document.getElementById("itemDesc").value.trim() || "Goods / Services";

  // Fill bill
  updateBillHeader(settings);

  document.getElementById("billInvoiceNo").textContent = invNo;
  document.getElementById("billDate").textContent = new Date(invDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  document.getElementById("billCustomer").textContent = customer;
  document.getElementById("billItemDesc").textContent = itemDesc;

  document.getElementById("billTaxable").textContent = formatINR(r.taxable);
  document.getElementById("billTaxable2").textContent = formatINR(r.taxable);
  document.getElementById("billCgst").textContent = formatINR(r.cgst);
  document.getElementById("billSgst").textContent = formatINR(r.sgst);
  document.getElementById("billIgst").textContent = formatINR(r.igst);
  document.getElementById("billTotalGst").textContent = formatINR(r.gstAmount);
  document.getElementById("billGrandTotal").textContent = formatINR(r.total);

  // Scroll to bill
  document.getElementById("billPreview").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Event Listeners ----------
document.addEventListener("DOMContentLoaded", () => {
  // Set today's date
  document.getElementById("invoiceDate").value = getToday();

  // Load settings
  applySettingsToUI();

  // Rate custom toggle
  document.getElementById("rate").addEventListener("change", function () {
    const customInput = document.getElementById("customRate");
    if (this.value === "custom") {
      customInput.classList.remove("hidden");
      customInput.focus();
    } else {
      customInput.classList.add("hidden");
    }
  });

  // Calculate button
  document.getElementById("calcBtn").addEventListener("click", calculate);

  // Auto calculate on amount / rate change (optional nice UX)
  document.getElementById("amount").addEventListener("input", () => {
    if (document.getElementById("resultBox").classList.contains("hidden") === false) {
      calculate();
    }
  });

  // Generate Bill
  document.getElementById("generateBillBtn").addEventListener("click", generateBill);

  // Print
  document.getElementById("printBtn").addEventListener("click", () => {
    if (!lastResult) generateBill();
    window.print();
  });

  // Settings Modal
  const modal = document.getElementById("settingsModal");
  document.getElementById("settingsBtn").addEventListener("click", () => {
    applySettingsToUI(); // refresh form
    modal.classList.remove("hidden");
  });

  document.getElementById("closeSettings").addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Click outside to close
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  // Save Settings
  document.getElementById("saveSettingsBtn").addEventListener("click", () => {
    const settings = {
      shopName: document.getElementById("shopName").value.trim() || "My Shop",
      gstin: document.getElementById("gstin").value.trim().toUpperCase(),
      address: document.getElementById("shopAddress").value.trim(),
      phone: document.getElementById("shopPhone").value.trim()
    };
    saveSettings(settings);
    updateBillHeader(settings);
    modal.classList.add("hidden");

    // Small feedback
    const btn = document.getElementById("saveSettingsBtn");
    const oldText = btn.textContent;
    btn.textContent = "✓ Saved!";
    btn.style.background = "#22c55e";
    setTimeout(() => {
      btn.textContent = oldText;
      btn.style.background = "";
    }, 1500);
  });

  // Initial calculation
  calculate();
});
