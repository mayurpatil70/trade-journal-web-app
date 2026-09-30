const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/AdminDashboard.jsx', 'utf8');

const newHeaders =                 <tr className="border-b border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="pb-3">User / TXID</th>
                  <th className="pb-3">Screenshot</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>;

content = content.replace(/<tr className="border-b border-white\/5 text-\[10px\] font-bold text-gray-400 uppercase tracking-widest">[\s\S]*?<\/tr>/, newHeaders);

const newRowContent =                     <td className="py-3 font-bold text-white">
                      <div>{ord.user_id || "Unknown"}</div>
                      <div className="text-gray-500 font-mono text-[10px]">{ord.txid || ord.chain || "N/A"}</div>
                    </td>
                    <td className="py-3 text-emerald-500 font-bold">
                      {ord.screenshot_url ? (
                        <a href={ord.screenshot_url} target="_blank" rel="noreferrer" className="text-blue-400 underline text-xs">View</a>
                      ) : "N/A"}
                    </td>
                    <td className="py-3">
                      <span
                        className={\px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider \\}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-500">
                      <button 
                        onClick={() => handleDeleteOrder(ord.id)}
                        className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 px-3 py-1 rounded-[2px] text-[10px] uppercase font-bold transition-colors"
                      >
                        Revoke / Delete
                      </button>
                    </td>;

content = content.replace(/<td className="py-3 font-bold text-white">[\s\S]*?\{new Action\(ord\.created_at\)\.toLocaleActionString\(\)\}[\s\S]*?<\/td>/, newRowContent);

fs.writeFileSync('frontend/src/pages/AdminDashboard.jsx', content);
console.log('Fixed file');
