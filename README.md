# Custom Bicycle System Overview

This is a web app for building custom bicycles. Users can pick components, check compatibility, place orders, and track them. Staff (admin, manager, clerk) have separate tools for managing inventory, orders, and reports.

## What you can do

- Register and log in as a customer, admin, manager, or clerk
- Browse components and filter by category, price, or stock
- Build a bike from parts (frame, fork, wheels, etc.)
- System checks compatibility between important parts like Frame + Fork and Tires + Wheels
- Add selected components to a cart and place an order
- Reduce component stock when an order reaches "ready" status
- Admin: manage components, compatibility rules, add staff accounts
- Manager: view stock and reports
- Clerk: manage orders, assembly, and fulfillment

## Tech stack

- Backend: Node.js, Express
- Database: PostgreSQL with Sequelize ORM
- Frontend: Plain HTML, CSS, JavaScript (no framework)


