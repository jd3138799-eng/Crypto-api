const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
const MY_WALLET = "TVhU4SSUzZ1xM9F3yMRZK33pG3JzykNKeN";
const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
let usedHashes = new Set();
app.get('/', (req, res) => { res.send('✅ Crypto API Running'); });
app.post('/api/verify-crypto-deposit', async (req, res) => {
  const { txHash, userId } = req.body;
  if(!txHash || !userId) return res.json({ success: false, message: "Missing hash" });
  if(usedHashes.has(txHash)) return res.json({ success: false, message: "Hash already used" });
  try {
    const url = `https://apilist.tronscanapi.com/api/transaction-info?hash=${txHash}`;
    const { data } = await axios.get(url);
    if(!data || !data.contractData) return res.json({ success: false, message: "Tx not found, wait 30s" });
    if(data.contractData.to_address !== MY_WALLET) return res.json({ success: false, message: "Not sent to our wallet" });
    if(data.contractData.contract_address !== USDT_CONTRACT) return res.json({ success: false, message: "Only USDT TRC20 allowed" });
    if(data.contractRet !== "SUCCESS") return res.json({ success: false, message: "Tx failed on chain" });
    let usdtAmount = data.contractData.amount / 1000000;
    let nairaAmount = usdtAmount * 1650;
    if(nairaAmount < 500) return res.json({ success: false, message: "Min ₦500" });
    usedHashes.add(txHash);
    return res.json({ success: true, amountNaira: nairaAmount.toFixed(2), usdt: usdtAmount });
  } catch (e) { return res.json({ success: false, message: "Blockchain verify failed" }); }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server on ${PORT}`); });
