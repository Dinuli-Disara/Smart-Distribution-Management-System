// backend/controllers/loyaltyLevelController.js
const { sequelize } = require('../config/database');

// @desc    Get all loyalty levels
// @route   GET /api/loyalty-levels
// @access  Private
exports.getLoyaltyLevels = async (req, res) => {
    try {
        const [levels] = await sequelize.query(`
            SELECT * FROM Loyalty_Level ORDER BY minimum_points ASC
        `);
        
        res.status(200).json({
            success: true,
            data: levels
        });
    } catch (error) {
        console.error('Get loyalty levels error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch loyalty levels'
        });
    }
};

// @desc    Get loyalty level by ID
// @route   GET /api/loyalty-levels/:id
// @access  Private
exports.getLoyaltyLevelById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [levels] = await sequelize.query(`
            SELECT * FROM Loyalty_Level WHERE level_id = ?
        `, {
            replacements: [id]
        });
        
        if (levels.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Loyalty level not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: levels[0]
        });
    } catch (error) {
        console.error('Get loyalty level error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch loyalty level'
        });
    }
};

// @desc    Get customer loyalty statistics
// @route   GET /api/loyalty-levels/customer/:customerId/stats
// @access  Private
exports.getCustomerLoyaltyStats = async (req, res) => {
    try {
        const { customerId } = req.params;
        
        // Get current customer with loyalty level
        const [customer] = await sequelize.query(`
            SELECT 
                c.customer_id,
                c.loyalty_points,
                c.loyalty_level_id,
                ll.level_name,
                ll.discount_percentage,
                ll.credit_limit,
                ll.minimum_points,
                ll.maximum_points
            FROM Customer c
            LEFT JOIN Loyalty_Level ll ON c.loyalty_level_id = ll.level_id
            WHERE c.customer_id = ?
        `, {
            replacements: [customerId]
        });
        
        if (customer.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        // Get next level
        const [nextLevel] = await sequelize.query(`
            SELECT * FROM Loyalty_Level 
            WHERE minimum_points > ?
            ORDER BY minimum_points ASC
            LIMIT 1
        `, {
            replacements: [customer[0].loyalty_points || 0]
        });
        
        // Get total points earned and redeemed
        const [transactions] = await sequelize.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN transaction_type IN ('purchase', 'bonus') THEN points ELSE 0 END), 0) as total_earned,
                COALESCE(SUM(CASE WHEN transaction_type = 'redeem' THEN points ELSE 0 END), 0) as total_redeemed
            FROM Loyalty_Transaction
            WHERE customer_id = ?
        `, {
            replacements: [customerId]
        });
        
        res.status(200).json({
            success: true,
            data: {
                total_points: customer[0].loyalty_points || 0,
                current_level: {
                    level_id: customer[0].loyalty_level_id,
                    level_name: customer[0].level_name || 'Blue',
                    discount_percentage: customer[0].discount_percentage || 0,
                    credit_limit: customer[0].credit_limit || 50000
                },
                next_level: nextLevel.length > 0 ? {
                    level_id: nextLevel[0].level_id,
                    level_name: nextLevel[0].level_name,
                    minimum_points: nextLevel[0].minimum_points,
                    discount_percentage: nextLevel[0].discount_percentage,
                    credit_limit: nextLevel[0].credit_limit
                } : null,
                points_to_next_level: nextLevel.length > 0 ? 
                    Math.max(0, nextLevel[0].minimum_points - (customer[0].loyalty_points || 0)) : 0,
                total_points_earned: transactions[0]?.total_earned || 0,
                total_points_redeemed: transactions[0]?.total_redeemed || 0
            }
        });
    } catch (error) {
        console.error('Get customer loyalty stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch loyalty statistics'
        });
    }
};

// @desc    Get loyalty transactions
// @route   GET /api/loyalty-levels/customer/:customerId/transactions
// @access  Private
exports.getLoyaltyTransactions = async (req, res) => {
    try {
        const { customerId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        const [transactions] = await sequelize.query(`
            SELECT 
                lt.transaction_id,
                lt.points,
                lt.points_earned,
                lt.points_used,
                lt.transaction_type,
                lt.reference_id,
                lt.description,
                lt.created_at
            FROM Loyalty_Transaction lt
            WHERE lt.customer_id = ?
            ORDER BY lt.created_at DESC
            LIMIT ? OFFSET ?
        `, {
            replacements: [customerId, limit, offset]
        });
        
        const [total] = await sequelize.query(`
            SELECT COUNT(*) as total FROM Loyalty_Transaction WHERE customer_id = ?
        `, {
            replacements: [customerId]
        });
        
        res.status(200).json({
            success: true,
            data: {
                transactions,
                total: total[0]?.total || 0,
                page,
                limit,
                total_pages: Math.ceil((total[0]?.total || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Get loyalty transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch loyalty transactions'
        });
    }
};

// @desc    Redeem points
// @route   POST /api/loyalty-levels/customer/:customerId/redeem
// @access  Private (Customer)
exports.redeemPoints = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { points, reward_id } = req.body;
        
        if (!points || points <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid points amount is required'
            });
        }
        
        // Check customer points balance
        const [customer] = await sequelize.query(`
            SELECT loyalty_points FROM Customer WHERE customer_id = ?
        `, {
            replacements: [customerId]
        });
        
        if (customer.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        if (customer[0].loyalty_points < points) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient loyalty points'
            });
        }
        
        // Deduct points
        await sequelize.query(`
            UPDATE Customer 
            SET loyalty_points = loyalty_points - ?,
                modified_at = NOW()
            WHERE customer_id = ?
        `, {
            replacements: [points, customerId]
        });
        
        // Record transaction
        await sequelize.query(`
            INSERT INTO Loyalty_Transaction (
                customer_id,
                points,
                points_used,
                transaction_type,
                reference_id,
                created_at
            ) VALUES (?, ?, ?, 'redeem', ?, NOW())
        `, {
            replacements: [customerId, points, points, reward_id || `Points redemption of ${points}`]
        });
        
        res.status(200).json({
            success: true,
            message: `${points} points redeemed successfully`
        });
    } catch (error) {
        console.error('Redeem points error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to redeem points'
        });
    }
};