const fs = require('fs');
const file = 'src/components/dashboard/OrderManager.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add Digital label rendering
const targetLabel = `{order.orderType === 'delivery' ? 'Home Delivery' : `;
const replacementLabel = `{order.orderType === 'digital' ? 'Digital Purchase' : order.orderType === 'delivery' ? 'Home Delivery' : `;

if (code.includes(targetLabel)) {
  code = code.replace(targetLabel, replacementLabel);
}

const targetTypeChip = `{order.orderType === 'delivery' && <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Delivery</span>}
                    {order.orderType === 'pickup' && <span className="bg-sky-100 text-sky-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Pickup</span>}`;

const replacementTypeChip = `{order.orderType === 'delivery' && <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Delivery</span>}
                    {order.orderType === 'pickup' && <span className="bg-sky-100 text-sky-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Pickup</span>}
                    {order.orderType === 'digital' && <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Digital</span>}`;

if (code.includes(`{order.orderType === 'pickup'`)) {
  code = code.replace(targetTypeChip, replacementTypeChip);
}

fs.writeFileSync(file, code);
