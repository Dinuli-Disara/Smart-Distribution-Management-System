// backend/controllers/paymentController.js
const { sequelize } = require('../config/database');

// @desc    Record customer payment
// @route   POST /api/payments/customer
// @access  Private (Clerk, Owner)
exports.recordCustomerPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      customer_id, 
      order_id, 
      amount, 
      payment_method, 
      payment_date,
      cheque_details 
    } = req.body;

    // Validation
    if (!customer_id || !amount || !payment_method || !payment_date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate payment method
    if (!['CASH', 'CHEQUE'].includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    // If cheque, validate cheque details
    if (payment_method === 'CHEQUE') {
      if (!cheque_details || !cheque_details.cheque_number || !cheque_details.bank_name) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Please provide cheque details'
        });
      }
    }

    // Create payment record
    const [paymentResult] = await sequelize.query(`
      INSERT INTO Customer_Payment
      (customer_id, order_id, amount, payment_method, cheque_number, payment_date, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        customer_id,
        order_id || null,
        amount,
        payment_method,
        payment_method === 'CHEQUE' ? cheque_details.cheque_number : null,
        payment_date,
        req.user.id,
        req.user.id
      ],
      transaction
    });

    const paymentId = paymentResult;

    // If cheque, create cheque details
    if (payment_method === 'CHEQUE') {
      await sequelize.query(`
        INSERT INTO Cheque_Details
        (payment_id, cheque_number, bank_name, account_holder, cheque_date, due_date, cheque_status)
        VALUES (?, ?, ?, ?, ?, ?, 'RECEIVED')
      `, {
        replacements: [
          paymentId,
          cheque_details.cheque_number,
          cheque_details.bank_name,
          cheque_details.account_holder,
          cheque_details.cheque_date,
          cheque_details.due_date
        ],
        transaction
      });
    }

    // Update order payment status if order_id provided
    if (order_id) {
      const [order] = await sequelize.query(`
        SELECT total_amount,
               COALESCE((SELECT SUM(amount) FROM Customer_Payment WHERE order_id = ?), 0) as total_paid
        FROM \`Order\`
        WHERE order_id = ?
      `, {
        replacements: [order_id, order_id],
        transaction
      });

      if (order.length > 0) {
        const totalAmount = order[0].total_amount;
        const totalPaid = parseFloat(order[0].total_paid) + parseFloat(amount);

        let paymentStatus = 'UNPAID';
        if (totalPaid >= totalAmount) {
          paymentStatus = 'PAID';
        } else if (totalPaid > 0) {
          paymentStatus = 'PARTIAL';
        }

        await sequelize.query(`
          UPDATE \`Order\`
          SET payment_status = ?, updated_by = ?
          WHERE order_id = ?
        `, {
          replacements: [paymentStatus, req.user.id, order_id],
          transaction
        });
      }
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment_id: paymentId
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Record customer payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get customer payments
// @route   GET /api/payments/customer/:customerId
// @access  Private
exports.getCustomerPayments = async (req, res) => {
  try {
    const [payments] = await sequelize.query(`
      SELECT 
        cp.*,
        o.order_date,
        o.total_amount as order_amount,
        cd.bank_name,
        cd.cheque_status,
        cd.due_date as cheque_due_date
      FROM Customer_Payment cp
      LEFT JOIN \`Order\` o ON cp.order_id = o.order_id
      LEFT JOIN Cheque_Details cd ON cp.payment_id = cd.payment_id
      WHERE cp.customer_id = ?
      ORDER BY cp.payment_date DESC
    `, {
      replacements: [req.params.customerId]
    });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Get customer payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
};

// @desc    Record manufacturer payment
// @route   POST /api/payments/manufacturer
// @access  Private (Owner, Clerk)
exports.recordManufacturerPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      manufacturer_id,
      purchase_id,
      amount, 
      cheque_number, 
      due_date, 
      payment_date 
    } = req.body;

    // Validation
    if (!manufacturer_id || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide manufacturer and amount'
      });
    }

    // Create payment record
    const [paymentResult] = await sequelize.query(`
      INSERT INTO Manufacturer_Payment
      (manufacturer_id, purchase_id, amount, cheque_number, due_date, payment_date, payment_status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        manufacturer_id,
        purchase_id || null,
        amount,
        cheque_number || null,
        due_date || null,
        payment_date || null,
        payment_date ? 'PAID' : 'PENDING',
        req.user.id
      ],
      transaction
    });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Manufacturer payment recorded successfully',
      data: {
        payment_id: paymentResult
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Record manufacturer payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment'
    });
  }
};

// @desc    Get all pending cheques (due soon)
// @route   GET /api/payments/cheques/pending
// @access  Private
exports.getPendingCheques = async (req, res) => {
  try {
    const daysAhead = req.query.days || 7;

    const [cheques] = await sequelize.query(`
      SELECT 
        cd.*,
        cp.amount,
        cp.payment_date,
        c.name as customer_name,
        c.contact as customer_contact
      FROM Cheque_Details cd
      JOIN Customer_Payment cp ON cd.payment_id = cp.payment_id
      JOIN Customer c ON cp.customer_id = c.customer_id
      WHERE cd.cheque_status IN ('RECEIVED', 'DEPOSITED')
        AND cd.due_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY cd.due_date ASC
    `, {
      replacements: [daysAhead]
    });

    res.status(200).json({
      success: true,
      count: cheques.length,
      data: cheques
    });
  } catch (error) {
    console.error('Get pending cheques error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending cheques'
    });
  }
};

// @desc    Update cheque status
// @route   PUT /api/payments/cheques/:id/status
// @access  Private (Clerk, Owner)
exports.updateChequeStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { cheque_status, deposit_date, clearance_date, notes } = req.body;

    // Valid statuses
    const validStatuses = ['RECEIVED', 'DEPOSITED', 'CLEARED', 'RETURNED', 'CANCELLED', 'REDEPOSITED'];
    if (!validStatuses.includes(cheque_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cheque status'
      });
    }

    const updates = ['cheque_status = ?'];
    const values = [cheque_status];

    if (cheque_status === 'DEPOSITED' && deposit_date) {
      updates.push('deposit_date = ?');
      updates.push('deposited_by_employee_id = ?');
      values.push(deposit_date);
      values.push(req.user.id);
    }

    if (cheque_status === 'CLEARED' && clearance_date) {
      updates.push('clearance_date = ?');
      updates.push('clearance_updated_by = ?');
      values.push(clearance_date);
      values.push(req.user.id);
    }

    if (notes) {
      updates.push('notes = ?');
      values.push(notes);
    }

    values.push(req.params.id);

    await sequelize.query(`
      UPDATE Cheque_Details
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE cheque_id = ?
    `, {
      replacements: values,
      transaction
    });

    // If cheque is returned, create return history
    if (cheque_status === 'RETURNED') {
      await sequelize.query(`
        INSERT INTO Cheque_Return_History
        (cheque_id, return_date, return_reason, handled_by_employee_id, action_taken)
        VALUES (?, CURDATE(), ?, ?, 'REDEPOSIT')
      `, {
        replacements: [req.params.id, notes || 'Cheque returned by bank', req.user.id],
        transaction
      });
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Cheque status updated successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update cheque status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cheque status'
    });
  }
};

// @desc    Get payment aging report
// @route   GET /api/payments/aging
// @access  Private
exports.getPaymentAging = async (req, res) => {
  try {
    const [aging] = await sequelize.query(`
      SELECT 
        c.customer_id,
        c.name as customer_name,
        c.contact,
        r.route_name,
        SUM(o.total_amount) as total_invoiced,
        COALESCE(SUM(cp.amount), 0) as total_paid,
        SUM(o.total_amount) - COALESCE(SUM(cp.amount), 0) as outstanding,
        SUM(CASE 
          WHEN DATEDIFF(CURDATE(), o.order_date) <= 30 
          THEN o.total_amount - COALESCE(paid_30.amount, 0)
          ELSE 0 
        END) as aging_0_30,
        SUM(CASE 
          WHEN DATEDIFF(CURDATE(), o.order_date) BETWEEN 31 AND 45 
          THEN o.total_amount - COALESCE(paid_45.amount, 0)
          ELSE 0 
        END) as aging_31_45,
        SUM(CASE 
          WHEN DATEDIFF(CURDATE(), o.order_date) > 45 
          THEN o.total_amount - COALESCE(paid_60.amount, 0)
          ELSE 0 
        END) as aging_45_plus
      FROM Customer c
      LEFT JOIN \`Order\` o ON c.customer_id = o.customer_id
      LEFT JOIN Delivery_Route r ON c.route_id = r.route_id
      LEFT JOIN Customer_Payment cp ON o.order_id = cp.order_id
      LEFT JOIN (
        SELECT order_id, SUM(amount) as amount 
        FROM Customer_Payment 
        GROUP BY order_id
      ) paid_30 ON o.order_id = paid_30.order_id
      LEFT JOIN (
        SELECT order_id, SUM(amount) as amount 
        FROM Customer_Payment 
        GROUP BY order_id
      ) paid_45 ON o.order_id = paid_45.order_id
      LEFT JOIN (
        SELECT order_id, SUM(amount) as amount 
        FROM Customer_Payment 
        GROUP BY order_id
      ) paid_60 ON o.order_id = paid_60.order_id
      WHERE o.payment_status != 'PAID'
      GROUP BY c.customer_id
      HAVING outstanding > 0
      ORDER BY outstanding DESC
    `);

    res.status(200).json({
      success: true,
      count: aging.length,
      data: aging
    });
  } catch (error) {
    console.error('Get payment aging error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment aging report'
    });
  }
};