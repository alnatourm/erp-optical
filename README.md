# OptiVision Enterprise ERP 👓

OptiVision Enterprise ERP is a comprehensive, cloud-ready Point of Sale (POS) and Enterprise Resource Planning (ERP) system designed specifically for optical centers, eyewear stores, and optometry clinics. 

Built with modern web technologies, it provides a seamless, bilingual (Arabic and English) interface to manage everything from sales and inventory to laboratory jobs and customer relationships.

## 🌟 Key Features

### 1. Point of Sale (POS) & Invoicing
*   **Smart Invoicing:** Create detailed invoices including frame and lens specifications.
*   **Flexible Payments:** Support for multiple payment methods (Cash, Visa, Cliq, Bank Transfer, Insurance) including **Dynamic Split Payments** (e.g., partial cash, partial insurance).
*   **Deposits & Balances:** Manage upfront deposits and track remaining balances for custom orders.
*   **Thermal Printing:** Ready-to-print layouts optimized for thermal receipt printers.

### 2. Inventory & Stock Management
*   **Product Database:** Manage frames, lenses, sunglasses, and contact lenses with detailed attributes (brands, models, barcodes).
*   **Multi-Branch Sync:** Track stock quantities across different physical branches in real-time.
*   **Stock Auditing:** Dedicated auditing modules to reconcile physical stock with digital records.
*   **Purchase Orders:** Track supplier orders and inventory intake.

### 3. Optical Laboratory Management
*   **Prescription Tracking:** Record detailed eye exam results (SPH, CYL, AXIS, ADD, IPD, VA) for Right (OD) and Left (OS) eyes.
*   **Lab Workflow:** Track glasses from the sales floor to the lab, and monitor preparation status (Pending, Processing, Ready for Delivery, Delivered).

### 4. CRM & Customer 360
*   **Customer Profiles:** Comprehensive view of customer history, previous purchases, and past optical prescriptions.
*   **Loyalty Program:** Automated loyalty points accumulation and membership tiers (Bronze, Silver, Gold, Platinum).
*   **Call Center Module:** Manage after-sales follow-ups, warranty claims, and routine eye-exam reminders.

### 5. Accounting & Financial Reports
*   **Z-Reports (Cash Closings):** Daily branch closing reports with expected vs. actual cash reconciliation.
*   **Extensive Reporting:** Track total sales, discounts, outstanding balances, and supplier payments.
*   **Admin Overrides:** Role-based access control (RBAC) allowing admins to edit historical invoices or adjust financial records safely.
*   **Export:** Export all financial tables to CSV/Excel for external auditing.

### 6. Team & Branch Management
*   **Role-Based Access:** Differentiate between Admins, Salespeople, Cashiers, and Accountants.
*   **Cash Handovers:** Secure workflows for transferring cash between shifts or branches.

## 🛠 Tech Stack

*   **Frontend Framework:** React 18 (with Vite)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Icons:** Lucide React
*   **Database & Backend:** Firebase (Firestore)
*   **State Management:** React Hooks & Custom Store Services (`src/lib/erpStore.ts`)

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/optivision-erp.git
   cd optivision-erp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add your Firebase configuration details:
   ```env
   VITE_FIREBASE_API_KEY="your_api_key"
   VITE_FIREBASE_AUTH_DOMAIN="your_auth_domain"
   VITE_FIREBASE_PROJECT_ID="your_project_id"
   VITE_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
   VITE_FIREBASE_APP_ID="your_app_id"
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

### Build for Production
To generate a production-ready build, run:
```bash
npm run build
```
The optimized files will be output to the `dist` directory.

## 📂 Project Structure

```text
src/
├── components/          # Modular React components (Dashboard, POS, CRM, Reports)
├── lib/                 # Core business logic, Firebase setup, and ERP State store
├── types.ts             # TypeScript interfaces for database schemas and state
├── App.tsx              # Main application entry and routing logic
├── index.css            # Tailwind global stylesheet
└── main.tsx             # React DOM rendering entry
```

## 🌍 Localization
The application natively supports seamless toggling between **Arabic (RTL)** and **English (LTR)**, ensuring accessibility for diverse workforces in the MENA region and globally.

## 📄 License
This project is proprietary software. All rights reserved.
