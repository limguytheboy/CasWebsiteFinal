# 🌐 CAS School Bazaar Order & Logistics Management Platform

A responsive, production-ready full-stack e-commerce and back-office management platform engineered to streamline order placements, payment verifications, and inventory logistics for the high school CAS fundraising bazaar (e.g., cookie sales).

This project transitions chaotic messaging-based manual ordering into a centralized, role-based web application to automate order pipelines and track real-time sales revenue.

---

## 🛠️ Architecture & Core Features

### 1. 4-Tier Role Hierarchy & Authentication System
Designed and implemented a structured user authorization pipeline split into four distinct access levels:
* **Customer:** Browses the menu, manages a dynamic **Shopping Cart (장바구니)**, and places orders.
* **Staff:** Monitors the active kitchen/preparation queue and updates live fulfillment tracking.
* **Admin:** Oversees entire event operations, adjusts global system configurations, and tracks raw data.
* **Hierarchy Enforcement:** Secured route access based on user metadata fetched dynamically via the Supabase auth instance.

### 2. End-to-End Order & Payment Pipeline
* **Dynamic Shopping Cart:** Built a client-side state management system allowing customers to seamlessly add, modify, and calculate item quantities before checkout.
* **Payment Proof Verification:** Implemented a secure file-upload pipeline where customers input delivery addresses and upload transaction receipt proofs (Payment Proof) to verify non-cash transfers.
* **Order State Machine:** Programmed a backend state tracker (`OrderState`) to transition orders seamlessly from *Pending Verification* ➔ *In Preparation* ➔ *Out for Delivery* ➔ *Completed*.

### 3. Inventory Control (CRUD) & Sales Dashboard
* **Dynamic Content Management (CRUD):** Built an administrative interface allowing real-time inventory adjustments, empowering admins to instantly create, read, update, and delete menu items as stock fluctuates.
* **Revenue Analytics Dashboard:** Constructed an executive data viewport that aggregates processed orders to display overall gross sales revenue and total unit velocity, replacing manual paper-ledger tracking.

---

## 💻 Tech Stack Detail
* **Frontend:** TypeScript, JavaScript, Tailwind CSS (Responsive UI Layouts)
* **Backend/Database:** Supabase (PostgreSQL relational database & storage buckets for payment proofs)
* **Hosting & Deployment:** Vercel (Continuous Integration/Continuous Deployment)
* **Development Paradigm:** AI-assisted rapid prototyping (Lovable/AI Vibe Coding workflows)

---
*For a high-level overview of my complete development portfolio, quantitative analytics, and other core systems, please visit my main profile: [github.com/limguytheboy](https://github.com/limguytheboy)*
