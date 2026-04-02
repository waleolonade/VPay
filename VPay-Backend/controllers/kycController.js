const { pool } = require('../config/database');
const User = require('../models/User');
const { verifyBvnVbaas, verifyNinVbaas } = require('../services/vfdKycService');

// @desc    Submit BVN & DOB Verification via vbaas.vfdtech.ng (Tier 1 -> Tier 2)
// @route   POST /api/v1/kyc/bvn
const verifyBVN = async (req, res, next) => {
    try {
        const { bvn, dateOfBirth } = req.body;
        if (!bvn || bvn.length !== 11 || !dateOfBirth) {
            return res.status(400).json({ success: false, message: 'Valid 11-digit BVN and Date of Birth is strictly required.' });
        }

        // Call vbaas.vfdtech.ng API to verify BVN explicitly
        let vfdClientInfo;
        try {
            vfdClientInfo = await verifyBvnVbaas(bvn, dateOfBirth);
        } catch (apiError) {
            return res.status(400).json({ success: false, message: 'BVN failed vbaas.vfdtech.ng registry validation: ' + apiError.message });
        }

        if (vfdClientInfo) {
            // Create KYC schema record
            await pool.query(
                'INSERT INTO kyc_verification (user_id, bvn, status) VALUES (?, ?, ?)',
                [req.user.id, bvn, 'verified']
            );

            // Upgrade User to Tier 2 with VFD limits
            await User.update(req.user.id, {
                bvnVerified: true,
                kycLevel: 2,
                dailyTransferLimit: 500000,
                dailyWithdrawalLimit: 500000
            });

            return res.status(200).json({ success: true, message: 'BVN verified securely via vbaas.vfdtech.ng. You are now Tier 2.' });
        } else {
            return res.status(400).json({ success: false, message: 'vbaas BVN verification failed' });
        }
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'KYC already submitted or BVN linked to another user' });
        }
        next(error);
    }
};

// @desc    Submit NIN & Advanced Document Upload via vbaas.vfdtech.ng (Tier 2 -> Tier 3)
// @route   POST /api/v1/kyc/nin
const verifyNIN = async (req, res, next) => {
    try {
        const { nin, idType, documentImageUrl } = req.body;

        if (!nin || !documentImageUrl) {
            return res.status(400).json({ success: false, message: 'NIN and Document Image Upload are strictly required by VFD Tech for Tier 3 upgrade.' });
        }

        // Send to vbaas.vfdtech.ng advanced verification tools (OCR & Face Match)
        let advancedVerification;
        try {
            advancedVerification = await verifyNinVbaas(nin, documentImageUrl);
        } catch (apiError) {
            return res.status(400).json({ success: false, message: 'vbaas.vfdtech.ng Tier 3 Verification failed: ' + apiError.message });
        }

        // Update ID in local schema
        await pool.query(
            'UPDATE kyc_verification SET nin = ?, id_type = ?, id_document = ?, status = ? WHERE user_id = ?',
            [nin, idType || 'national_id', documentImageUrl, 'verified', req.user.id]
        );

        // Update User Limits to Tier 3 VFD standard
        await User.update(req.user.id, {
            ninVerified: true,
            kycLevel: 3,
            dailyTransferLimit: 5000000,
            dailyWithdrawalLimit: 5000000
        });

        res.status(200).json({ success: true, message: 'Identity fully verified via advanced vbaas.vfdtech.ng tools. You are now Tier 3.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { verifyBVN, verifyNIN };
