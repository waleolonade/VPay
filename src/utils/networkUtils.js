/**
 * Nigerian Network Provider Detection
 * Detects the network provider based on the phone number prefix.
 */

export const detectNetwork = (phone) => {
    if (!phone || phone.length < 4) return null;

    // Normalize phone number: remove +234 or 234 if present
    let cleanPhone = phone.replace(/^(\+234|234)/, '0');

    if (cleanPhone.length < 4) return null;

    const prefix = cleanPhone.slice(0, 4);

    const mtn = ['0703', '0706', '0803', '0806', '0810', '0813', '0814', '0816', '0903', '0906', '0913', '0916'];
    const airtel = ['0701', '0708', '0802', '0808', '0812', '0901', '0902', '0904', '0907', '0911', '0912'];
    const glo = ['0705', '0805', '0807', '0811', '0815', '0905', '0915'];
    const mobile9 = ['0809', '0817', '0818', '0908', '0909'];

    if (mtn.includes(prefix)) return 'mtn';
    if (airtel.includes(prefix)) return 'airtel';
    if (glo.includes(prefix)) return 'glo';
    if (mobile9.includes(prefix)) return '9mobile';

    return null;
};
