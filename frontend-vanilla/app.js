console.log("✅ app.js loaded");
// ✅ Top of file — define module address first
const MODULE_ADDRESS = "0xd6516e5440520ebea764c6ea3d085ff7d7a276244c0caf5d68ff9b10034a041e";



let currentAccount = null;

// 🔹 Auto-connect on page load
window.addEventListener("DOMContentLoaded", async () => {
  if (window.aptos) {
    try {
      const isConnected = await window.aptos.isConnected();
      if (isConnected) {
        const res = await window.aptos.account();
        currentAccount = res.address;
        document.getElementById("walletAddress").textContent = `✅ Connected: ${currentAccount}`;
      }
    } catch (err) {
      console.warn("Auto-connect failed:", err);
    }
  }
});

// 🔹 Manual connect button
document.getElementById("connectBtn").addEventListener("click", async () => {
  if (window.aptos) {
    try {
      const res = await window.aptos.connect();
      currentAccount = res.address;
      document.getElementById("walletAddress").textContent = `✅ Connected: ${currentAccount}`;
    } catch (err) {
      console.error("❌ Connection failed:", err);
    }
  } else {
    alert("Petra Wallet not found! Install it from https://petra.app/");
  }
});

document.getElementById("badgeBtn").addEventListener("click", async () => {
  if (!window.aptos) return alert("Petra Wallet not found!");
  if (!currentAccount) return alert("Connect wallet first!");

  const payload = {
    type: "entry_function_payload",
    function: "0xd6516e5440520ebea764c6ea3d085ff7d7a276244c0caf5d68ff9b10034a041e::civic_badge::claim_badge",
    arguments: [],
    type_arguments: []
  };

  console.log("🔍 Final function path:", payload.function);

  try {
    const tx = await window.aptos.signAndSubmitTransaction({ payload });
    alert(`✅ Badge claimed! TX hash: ${tx.hash}`);
  } catch (err) {
    console.error("❌ Badge claim failed:", err);
    alert("Badge claim failed: " + err.message);
  }
});





// 🔹 Submit Proposal
document.getElementById("submitProposalBtn").addEventListener("click", async () => {
  if (!currentAccount) return alert("Connect wallet first!");
  const title = document.getElementById("proposalTitle").value;
  if (!title) return alert("Enter a proposal title!");

  const payload = {
    type: "entry_function_payload",
    function: "0xd6516e5440520ebea764c6ea3d085ff7d7a276244c0caf5d68ff9b10034a041e::voting::create",
    arguments: [title],
    type_arguments: []
  };

  try {
    const tx = await window.aptos.signAndSubmitTransaction(payload);
    alert(`Proposal submitted! TX hash: ${tx.hash}`);
  } catch (err) {
    console.error("❌ Proposal failed:", err);
  }
});

// 🔹 Vote
document.getElementById("voteBtn").addEventListener("click", async () => {
  if (!currentAccount) return alert("Connect wallet first!");

  const owner = document.getElementById("voteOwner").value;
  const id = document.getElementById("voteId").value;
  const support = document.getElementById("voteChoice").value === "true";

  if (!owner || id === "") return alert("Fill all vote fields!");

  const payload = {
    type: "entry_function_payload",
    function: `${MODULE_ADDRESS}::voting::vote`,  // ✅ Correct function
    arguments: [owner, parseInt(id), support],    // ✅ Correct args
    type_arguments: []
  };

  try {
    const tx = await window.aptos.signAndSubmitTransaction({ payload });
    alert(`🗳️ Vote submitted! TX hash: ${tx.hash}`);
  } catch (err) {
    console.error("❌ Vote failed:", err);
    alert("Vote failed: " + err.message);
  }
});


// 🔹 Load Proposals
document.getElementById("loadProposalsBtn").addEventListener("click", async () => {
  const owner = document.getElementById("listOwner").value;
  if (!owner) return alert("Enter proposal owner address!");

  try {
    // Step 1: Get proposals length
    const lengthRes = await fetch("https://fullnode.testnet.aptoslabs.com/v1/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        function: `${MODULE_ADDRESS}::voting::proposals_len`,
        type_arguments: [],
        arguments: [owner]
      })
    });

    const lengthJson = await lengthRes.json();
    console.log("📦 proposals_len response:", lengthJson);

    if (!Array.isArray(lengthJson)) {
      throw new Error("Invalid response format from proposals_len");
    }

    const count = lengthJson[0];
    if (count === 0) {
      document.getElementById("proposalList").innerHTML = "<p>No proposals found.</p>";
      return;
    }

    // Step 2: Fetch each proposal
    let html = `<p>Total proposals: ${count}</p><ul>`;
    for (let i = 0; i < count; i++) {
      try {
        const propRes = await fetch("https://fullnode.testnet.aptoslabs.com/v1/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            function: `${MODULE_ADDRESS}::voting::borrow_proposal`,
            type_arguments: [],
            arguments: [owner, i.toString()]
          })
        });

        const result = await propRes.json();
        console.log(`📦 Proposal ${i} response:`, result);

        if (!Array.isArray(result) || result.length < 4) {
          html += `<li>⚠️ Proposal ${i} malformed</li>`;
          continue;
        }

        const titleBytes = result[0];
        const title = new TextDecoder().decode(Uint8Array.from(titleBytes));
        const yes = result[1];
        const no = result[2];
        const active = result[3];

        html += `<li><strong>${title}</strong> — ✅ ${yes} | ❌ ${no} | Active: ${active}</li>`;
      } catch (err) {
        console.error(`❌ Failed to load proposal ${i}:`, err);
        html += `<li>⚠️ Error loading proposal ${i}</li>`;
      }
    }

    html += "</ul>";
    document.getElementById("proposalList").innerHTML = html;

  } catch (err) {
    console.error("❌ Failed to load proposals:", err);
    alert("Error fetching proposals");
  }
});


// const MODULE_ADDRESS = "0xd8a5db309addc49542f3d35182e013c5582162a9f23ed312395d7be0b2e1ca0f";
// const BADGE_MODULE = `${MODULE_ADDRESS}::badge`;
// const VOTING_MODULE = `${MODULE_ADDRESS}::voting`;

// let wallet;

// async function connectWallet() {
//   const { PetraWallet } = aptosWalletAdapterPetra;
//   wallet = new PetraWallet();
//   await wallet.connect();
//   document.getElementById("wallet-address").innerText = `Wallet: ${wallet.account.address}`;
// }

// async function mintBadge() {
//   const payload = {
//     type: "entry_function_payload",
//     function: `${BADGE_MODULE}::claim_badge`,
//     arguments: [],
//     type_arguments: []
//   };
//   const tx = await wallet.signAndSubmitTransaction(payload);
//   document.getElementById("output").innerText = `Minted badge ✅ TX: ${tx.hash}`;
// }

// async function createProposal() {
//   const payload = {
//     type: "entry_function_payload",
//     function: `${VOTING_MODULE}::create`,
//     arguments: ["Demo Proposal Title"],
//     type_arguments: []
//   };
//   const tx = await wallet.signAndSubmitTransaction(payload);
//   document.getElementById("output").innerText = `Created proposal ✅ TX: ${tx.hash}`;
// }

// async function voteProposal() {
//   const payload = {
//     type: "entry_function_payload",
//     function: `${VOTING_MODULE}::vote`,
//     arguments: [wallet.account.address, "0xd8a5...", 0, true],
//     type_arguments: []
//   };
//   const tx = await wallet.signAndSubmitTransaction(payload);
//   document.getElementById("output").innerText = `Voted ✅ TX: ${tx.hash}`;
// }

// async function viewProposal() {
//   const res = await fetch("https://fullnode.testnet.aptoslabs.com/v1/view", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       function: `${VOTING_MODULE}::borrow_proposal`,
//       arguments: ["0xd8a5...", 0],
//       type_arguments: []
//     })
//   });
//   const data = await res.json();
//   document.getElementById("output").innerText = `Proposal: ${JSON.stringify(data)}`;
// }

// async function getProposalCount() {
//   const res = await fetch("https://fullnode.testnet.aptoslabs.com/v1/view", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       function: `${VOTING_MODULE}::proposals_len`,
//       arguments: ["0xd8a5..."],
//       type_arguments: []
//     })
//   });
//   const [count] = await res.json();
//   document.getElementById("output").innerText = `Total Proposals: ${count}`;
// // }
// console.log("✅ app.js loaded");

// // ✅ Your new module address
// const MODULE_ADDRESS = "0xd6516e5440520ebea764c6ea3d085ff7d7a276244c0caf5d68ff9b10034a041e";
// const aptosClient = new aptos.AptosClient("https://fullnode.testnet.aptoslabs.com");

// let currentAccount = null;

// // 🔹 Auto-connect on page load
// window.addEventListener("DOMContentLoaded", async () => {
//   if (window.aptos) {
//     try {
//       const isConnected = await window.aptos.isConnected();
//       if (isConnected) {
//         const res = await window.aptos.account();
//         currentAccount = res.address;
//         document.getElementById("walletAddress").textContent = `✅ Connected: ${currentAccount}`;
//       }
//     } catch (err) {
//       console.warn("Auto-connect failed:", err);
//     }
//   }
// });

// // 🔹 Connect Wallet
// document.getElementById("connectBtn").addEventListener("click", async () => {
//   if (!window.aptos) return alert("❌ Petra Wallet not found!");

//   try {
//     const res = await window.aptos.connect();
//     currentAccount = res.address;
//     document.getElementById("walletAddress").textContent = `✅ Connected: ${currentAccount}`;
//   } catch (err) {
//     console.error("❌ Connection failed:", err);
//     alert("Wallet connection failed");
//   }
// });

// // 🔹 Claim Badge
// document.getElementById("badgeBtn").addEventListener("click", async () => {
//   if (!currentAccount) return alert("Connect wallet first!");

//   const payload = {
//     type: "entry_function_payload",
//     function: `${MODULE_ADDRESS}::civic_badge::claim_badge`,
//     arguments: [],
//     type_arguments: []
//   };

//   try {
//     const tx = await window.aptos.signAndSubmitTransaction({ payload });
//     alert(`🎉 Badge claimed! TX hash: ${tx.hash}`);
//   } catch (err) {
//     console.error("❌ Badge claim failed:", err);
//     alert("Badge claim failed: " + err.message);
//   }
// });

// // 🔹 Submit Proposal
// document.getElementById("submitProposalBtn").addEventListener("click", async () => {
//   if (!currentAccount) return alert("Connect wallet first!");
//   const title = document.getElementById("proposalTitle").value;
//   if (!title) return alert("Enter a proposal title!");

//   const payload = {
//     type: "entry_function_payload",
//     function: `${MODULE_ADDRESS}::voting::create`,
//     arguments: [title],
//     type_arguments: []
//   };

//   try {
//     const tx = await window.aptos.signAndSubmitTransaction(payload);
//     alert(`📤 Proposal submitted! TX hash: ${tx.hash}`);
//   } catch (err) {
//     console.error("❌ Proposal failed:", err);
//     alert("Proposal submission failed");
//   }
// });

// // 🔹 Vote on Proposal
// document.getElementById("voteBtn").addEventListener("click", async () => {
//   if (!currentAccount) return alert("Connect wallet first!");

//   const owner = document.getElementById("voteOwner").value;
//   const id = document.getElementById("voteId").value;
//   const support = document.getElementById("voteChoice").value === "true";

//   if (!owner || id === "") return alert("Fill all vote fields!");

//   const payload = {
//     type: "entry_function_payload",
//     function: `${MODULE_ADDRESS}::voting::vote`,
//     arguments: [owner, parseInt(id), support],
//     type_arguments: []
//   };

//   try {
//     const tx = await window.aptos.signAndSubmitTransaction(payload);
//     alert(`🗳️ Vote submitted! TX hash: ${tx.hash}`);
//   } catch (err) {
//     console.error("❌ Vote failed:", err);
//     alert("Vote failed: " + err.message);
//   }
// });

// // 🔹 Load Proposals
// document.getElementById("loadProposalsBtn").addEventListener("click", async () => {
//   const owner = document.getElementById("listOwner").value;
//   if (!owner) return alert("Enter proposal owner address!");

//   try {
//     const lengthRes = await fetch("https://fullnode.testnet.aptoslabs.com/v1/view", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         function: `${MODULE_ADDRESS}::voting::proposals_len`,
//         type_arguments: [],
//         arguments: [owner]
//       })
//     });
//     const [count] = await lengthRes.json();

//     if (count === 0) {
//       document.getElementById("proposalList").innerHTML = "<p>No proposals found.</p>";
//       return;
//     }

//     let html = `<p>Total proposals: ${count}</p><ul>`;
//     for (let i = 0; i < count; i++) {
//       const propRes = await fetch("https://fullnode.testnet.aptoslabs.com/v1/view", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           function: `${MODULE_ADDRESS}::voting::borrow_proposal`,
//           type_arguments: [],
//           arguments: [owner, i.toString()]
//         })
//       });
//       const [proposal] = await propRes.json();
//       html += `<li><strong>${proposal.title}</strong> — ✅ ${proposal.yes} | ❌ ${proposal.no} | Active: ${proposal.active}</li>`;
//     }
//     html += "</ul>";
//     document.getElementById("proposalList").innerHTML = html;

//   } catch (err) {
//     console.error("❌ Failed to load proposals:", err);
//     alert("Error fetching proposals");
//   }
// });
