const express = require('express');
const { getBanksAndCards, listBanks, addBankAccount, removeBankAccount, resolveAccount, setDefaultAccount, addCard, removeCard } = require('../controllers/bankController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getBanksAndCards)
    .post(addBankAccount);

router.get('/list', listBanks);
router.get('/resolve', resolveAccount);
router.patch('/:id/default', setDefaultAccount);

router.delete('/:id', removeBankAccount);

router.post('/cards', addCard);
router.delete('/cards/:id', removeCard);

module.exports = router;
