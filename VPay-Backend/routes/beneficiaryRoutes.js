const express = require('express');
const router = express.Router();
const { getBeneficiaries, addBeneficiary, updateBeneficiary, deleteBeneficiary } = require('../controllers/beneficiaryController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getBeneficiaries);
router.post('/', addBeneficiary);
router.put('/:id', updateBeneficiary);
router.delete('/:id', deleteBeneficiary);

module.exports = router;
