-- Database Schema
-- Generated at: 2026-04-25T07:40:08.571Z

CREATE TABLE IF NOT EXISTS users (
  id TEXT,
  phone TEXT,
  password TEXT,
  role TEXT,
  name TEXT,
  id_card TEXT,
  merchant_type TEXT,
  address TEXT,
  avatar TEXT,
  status TEXT,
  created_at TEXT,
  updated_at TEXT,
  wechat_payment_qr TEXT,
  credit_score TEXT
);

CREATE TABLE IF NOT EXISTS demands (
  id TEXT,
  merchant_id TEXT,
  cargo_name TEXT,
  cargo_type TEXT,
  weight TEXT,
  volume TEXT,
  pickup_time TEXT,
  pickup_address TEXT,
  pickup_location TEXT,
  delivery_address TEXT,
  delivery_location TEXT,
  remarks TEXT,
  status TEXT,
  created_at TEXT,
  updated_at TEXT,
  owner_id TEXT
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT,
  owner_id TEXT,
  vehicle_type TEXT,
  load_capacity TEXT,
  volume TEXT,
  battery_life TEXT,
  operation_area TEXT,
  available_hours TEXT,
  status TEXT,
  photos TEXT,
  created_at TEXT,
  updated_at TEXT,
  remarks TEXT,
  license_plate TEXT,
  has_cold_chain TEXT,
  is_available TEXT,
  trip_status TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT,
  demand_id TEXT,
  vehicle_id TEXT,
  merchant_id TEXT,
  owner_id TEXT,
  status TEXT,
  pickup_photo_key TEXT,
  delivery_photo_key TEXT,
  delivery_proof_key TEXT,
  cancel_reason TEXT,
  cancel_time TEXT,
  accept_time TEXT,
  complete_time TEXT,
  created_at TEXT,
  updated_at TEXT,
  pickup_time TEXT,
  pickup_address TEXT,
  delivery_address TEXT,
  remarks TEXT,
  fare_price TEXT,
  merchant_confirmed TEXT,
  confirm_time TEXT,
  payment_status TEXT,
  commission_amount TEXT,
  commission_payment_status TEXT,
  transport_completed_time TEXT,
  payment_time TEXT,
  payment_confirm_time TEXT,
  commission_payment_time TEXT,
  commission_confirm_time TEXT,
  actual_complete_time TEXT
);

CREATE TABLE IF NOT EXISTS cancellation_requests (
  id TEXT,
  order_id TEXT,
  requestor_id TEXT,
  responder_id TEXT,
  reason TEXT,
  status TEXT,
  response_reason TEXT,
  responded_at TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT,
  user_id TEXT,
  type TEXT,
  title TEXT,
  content TEXT,
  related_order_id TEXT,
  related_demand_id TEXT,
  is_read TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT,
  commission_rate TEXT,
  commission_payment_qr TEXT,
  updated_at TEXT,
  created_at TEXT
);

