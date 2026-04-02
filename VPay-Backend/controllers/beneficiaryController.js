const Beneficiary = require('../models/Beneficiary');

// @desc    Get beneficiaries
// @route   GET /api/v1/beneficiaries
exports.getBeneficiaries = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { user: req.user.id };
    if (type) filter.type = type;
    const beneficiaries = await Beneficiary.find(filter);
    res.status(200).json({ success: true, data: beneficiaries });
  } catch (error) {
    next(error);
  }
};

// @desc    Add beneficiary
// @route   POST /api/v1/beneficiaries
exports.addBeneficiary = async (req, res, next) => {
  try {
    const beneficiary = await Beneficiary.create({ user: req.user.id, ...req.body });
    res.status(201).json({ success: true, message: 'Beneficiary added', data: beneficiary });
  } catch (error) {
    next(error);
  }
};

// @desc    Update beneficiary
// @route   PUT /api/v1/beneficiaries/:id
exports.updateBeneficiary = async (req, res, next) => {
  try {
    const beneficiary = await Beneficiary.findOneAndUpdate(
      { id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!beneficiary) return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    res.status(200).json({ success: true, data: beneficiary });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete beneficiary
// @route   DELETE /api/v1/beneficiaries/:id
exports.deleteBeneficiary = async (req, res, next) => {
  try {
    const beneficiary = await Beneficiary.findOneAndDelete({ id: req.params.id, user: req.user.id });
    if (!beneficiary) return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    res.status(200).json({ success: true, message: 'Beneficiary removed' });
  } catch (error) {
    next(error);
  }
};
