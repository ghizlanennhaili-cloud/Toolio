import React, { useState, useEffect, useMemo } from "react";
import { 
  Wrench, AlertTriangle, ZapOff, ShieldAlert, 
  Euro, Hourglass, BarChart3, LayoutDashboard, Settings, History,
  Sun, Moon, Plus, Edit2, Trash2, Image as ImageIcon, FileText, Search, X 
} from "lucide-react";
import "./Dashboard.css";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

const Dashboard = () => {
  // --- ÉTATS ---
  const [activeTab, setActiveTab] = useState("dashboard"); // Changé par défaut sur dashboard pour voir le résultat
  const [darkMode, setDarkMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); 
  const [viewingTool, setViewingTool] = useState(null); 
  const [editingTool, setEditingTool] = useState(null);




  const [tools, setTools] = useState([]);
  const [historyData, setHistoryData] = useState([]);
// Dans votre Dashboard.js
const fetchHistory = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/history');
        const data = await response.json();
        console.log("Données reçues pour le tableau :", data); // <--- REGARDEZ LA CONSOLE !
        
        // C'est crucial : data.history doit être un TABLEAU
        setHistoryData(data.history); 
    } catch (error) {
        console.error("Erreur :", error);
    }
};

// Appeler la fonction au chargement du composant
useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/tools');
            const data = await res.json();
            // C'est ici que React reçoit les données et met à jour l'interface
            if (data.tools) {
                setTools(data.tools);
            }
        } catch (err) {
            console.error("Erreur de récupération :", err);
        }
    };
    fetchData();    // Votre fonction existante
    fetchHistory();
}, []); // Le tableau vide [] garantit que cela s'exécute au chargement


  const initialFormState = {
    name: "", internalReference: "", category: "",
    description: "", supplier: "", commissioningDate: "", estimatedLifespan: "",
    status: "In Service", usageFrequency: "", lastMaintenance: "",
    nextMaintenance: "", purchasePrice: "", maintenanceCost: "",
    location: "Workshop A", generalCondition: "Good", riskLevel: "Low",
    image: null, technicalDoc: null
  };
const getStatusPieData = () => {
  const total = 150;
  const broken = 5;       // Vos données
  const endOfLife = 9;    // Vos données (j'ai ajusté selon votre énoncé précédent)
  const conforme = total - broken - endOfLife;

  return [
    { name: 'En panne', value: broken, color: '#ef4444' },    // Rouge
    { name: 'Fin de vie', value: endOfLife, color: '#eab308' }, // Jaune
    { name: 'Conforme', value: conforme, color: '#22c55e' }    // Vert
  ];
};


const kpis = useMemo(() => {
    // 1. Calculs sur les outils
    const totalTools = tools.length;
    const broken = tools.filter(t => t.status === 'Broken').length;
    const degraded = tools.filter(t => t.status === 'Degraded').length;
    const nearendoflife = tools.filter(t => t.generalCondition === 'Critical').length;
    const totalCost = tools.reduce((sum, t) => sum + (parseFloat(t.maintenanceCost) || 0), 0);

    // 2. Calculs sécurisés pour les indicateurs de maintenance
    const hasEvents = historyData && historyData.length > 0;

    // --- Calcul du MTTR (Mean Time To Repair) : Moyenne des temps d'arrêt ---
    const avgDowntime = hasEvents 
        ? (historyData.reduce((acc, e) => acc + parseFloat(e.downtime || 0), 0) / historyData.length).toFixed(1)
        : "Vide";

    const mttr = avgDowntime; // Le MTTR est la moyenne du temps d'arrêt

    // --- Calcul du MTBF (Mean Time Between Failures) : Intervalle moyen entre les pannes ---
    const mtbf = (hasEvents && historyData.length > 1)
        ? (() => {
            // On trie par date pour calculer les intervalles réels
            const sorted = [...historyData].sort((a, b) => new Date(a.date) - new Date(b.date));
            let totalIntervalDays = 0;
            
            for (let i = 1; i < sorted.length; i++) {
                const diffTime = new Date(sorted[i].date) - new Date(sorted[i - 1].date);
                const diffDays = diffTime / (1000 * 60 * 60 * 24); // Conversion ms en jours
                totalIntervalDays += diffDays;
            }
            return (totalIntervalDays / (sorted.length - 1)).toFixed(1);
        })()
        : "Vide";

    return { 
        totalTools, 
        broken, 
        degraded, 
        nearendoflife, 
        totalCost, 
        avgDowntime, 
        mtbf, 
        mttr 
    };
}, [tools, historyData]);


  const [newTool, setNewTool] = useState(initialFormState);
  const [newEvent, setNewEvent] = useState({
    toolId: "", toolName: "", reference: "", eventType: "Maintenance",
    reason: "", details: "", date: "", technician: "", cost: "",
    downtime: "", partsReplaced: "", oldStatus: "In Service",
    newStatus: "In Service", comments: ""
  });

  const toolHistory = viewingTool 
    ? historyData.filter(event => event.toolId === viewingTool.id) 
    : [];

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // --- FONCTIONS ACTIONS ---
  const handleEdit = (tool) => {
    setEditingTool({ ...tool });
  };

  const handleDelete = (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet outil ?")) {
      setTools(tools.filter(t => t.id !== id));
    }
  };


  const handleFileChange = (e, field, isEditing = false) => {
    const file = e.target.files[0];
    if (file) {
      const fileData = { name: file.name, url: URL.createObjectURL(file) };
      if (isEditing) {
        setEditingTool({ ...editingTool, [field]: fileData });
      } else {
        setNewTool({ ...newTool, [field]: fileData });
      }
    }
  };

  const handleUpdateTool = (e) => {
    e.preventDefault();
    setTools(tools.map(t => t.id === editingTool.id ? editingTool : t));
    setEditingTool(null);
  };

// REPLACE your current handleAddTool
const handleAddTool = async (e) => {
    e.preventDefault();
    
    // 1. Envoyer la donnée au serveur
    const response = await fetch('http://localhost:5000/api/add-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTool), // newTool est votre objet formulaire
    });

    if (response.ok) {
        const result = await response.json();
        
        // 2. IMPORTANT : Mettre à jour l'état local pour rafraîchir l'affichage
        // On crée un nouvel objet qui contient l'ID renvoyé par le serveur
        const toolWithId = { ...newTool, id: result.id };
        
        // On ajoute cet outil au tableau existant sans avoir à recharger la page
        setTools([...tools, toolWithId]);
        
        alert('Tool added successfully!');
        setIsModalOpen(false); // Fermer le formulaire
    } else {
        alert('Error saving tool.');
    }
};

// REPLACE your current handleLogEvent
const handleLogEvent = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:5000/api/add-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
    });
    if (response.ok) {
        alert('Event logged successfully!');
        setIsLogModalOpen(false);
    } else {
        alert('Error saving event.');
    }
};


  
const stats = [
  { 
    title: "Total Tools", 
    value: kpis.totalTools, 
    icon: <Wrench />, 
    iconColor: "#22c55e",
    description: `Inventaire Global :\n• Total : ${kpis.totalTools} outils` 
  },
  { 
    title: "Out of Service", 
    value: kpis.broken, 
    icon: <AlertTriangle />, 
    iconColor: "#ef4444",
    description: `Disponibilité :\n• En panne : ${kpis.broken}`
  },
  { 
    title: "Degraded Tools", 
    value: kpis.degraded, 
    icon: <ZapOff />, 
    iconColor: "#f97316",
    description: `Performance :\n• Dégradés : ${kpis.degraded}`
  },
  { 
    title: "Near End-of-Life", 
    value: kpis.nearendoflife, 
    icon: <ShieldAlert />, 
    iconColor: "#eab308",
    description: `Cycle de vie :\n• Critique : ${kpis.nearendoflife}`
  },
  { 
    title: "Maint. Cost", 
    value: kpis.totalCost === 0 ? "Vide" : `${kpis.totalCost} €`, 
    icon: <Euro />, 
    iconColor: "#64748b",
    description: `Finances :\n• Coût cumulé : ${kpis.totalCost === 0 ? "Vide" : kpis.totalCost + " €"}`
  },
  { 
    title: "Avg Downtime", 
    value: kpis.avgDowntime === "Vide" ? "Vide" : `${kpis.avgDowntime}h`, 
    icon: <Hourglass />, 
    iconColor: "#ef4444",
    description: `Indisponibilité :\n• Moyenne : ${kpis.avgDowntime === "Vide" ? "Vide" : kpis.avgDowntime + " heures"}`
  },
  { 
    title: "Reliability", 
    value: kpis.mtbf === "Vide" ? "Vide" : `${kpis.mtbf}d`, 
    icon: <BarChart3 />, 
    iconColor: "#22c55e",
    description: `Fiabilité (MTBF) :\n• Fréquence : ${kpis.mtbf === "Vide" ? "Vide" : "1 panne tous les " + kpis.mtbf + " jours"}`
  },
  { 
    title: "Repair Time", 
    value: kpis.mttr === "Vide" ? "Vide" : `${kpis.mttr}h`, 
    icon: <Settings />, 
    iconColor: "#f97316",
    description: `Réparation (MTTR) :\n• Réactivité : ${kpis.mttr === "Vide" ? "Vide" : kpis.mttr + "h en moyenne"}`
  },
];


const getCategoryData = () => {
  // On compte les outils par catégorie
  const counts = tools.reduce((acc, tool) => {
    const cat = tool.category || "Autre";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // On transforme l'objet en tableau pour Recharts
  return Object.keys(counts).map(key => ({
    name: key,
    value: counts[key]
  }));
};

console.log("My tools in React :", tools);


  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title"><Wrench className="title-icon" /> Toolio</h1>
        <div className="header-right">
          <nav className="nav-container">
            <button className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
            <button className={`nav-item ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>History</button>

          </nav>
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
        </div>
      </header>

      <main className="main-content">
{activeTab === "analytics" && (
  <div className="analytics-view" style={{ padding: '20px', width: '100%', height: '500px' }}>
    <h2 className="nature-title" style={{ marginBottom: '20px' }}>
      Répartition des outils par catégorie
    </h2>
    <div style={{ 
      width: '100%', 
      height: '400px', // Donnez une hauteur fixe explicite ici
      backgroundColor: 'var(--card-bg)', 
      borderRadius: '15px', 
      padding: '20px',
      boxShadow: 'var(--shadow)' 
    }}>
      {/* Vérification de sécurité pour éviter le crash si les données sont vides */}
      {getCategoryData().length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={getCategoryData()}>
            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {getCategoryData().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ color: 'var(--text-secondary)' }}>Aucune donnée disponible pour le graphique.</p>
      )}
    </div>
  </div>
)}

        {activeTab === "dashboard" && (
          <>
            {/* KPI Section */}
           
<div className="kpi-grid">
  {stats.map((stat, index) => (
    <div 
      key={index} 
      className="kpi-card" 
      title={stat.description} // Vérifiez bien que c'est stat.description
      style={{ cursor: 'help' }} // Ajoutez ceci pour tester : le curseur doit changer
    >
      <div className="card-info">
        <h3>{stat.title}</h3>
        <p className="value-black">{stat.value}</p>
      </div>
      <div className="card-icon-container" style={{ color: stat.iconColor }}>
        {stat.icon}
      </div>
    </div>
  ))}
</div>
              
            {/* INTEGRATION DU TABLEAU DANS LE DASHBOARD */}
            <div className="tools-view" style={{ marginTop: '40px' }}>
              <div className="title-section-with-btn">
                <h2 className="nature-title">Tools Overview</h2>
                <button className="add-btn-inline" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Add Tool</button>
              </div>
              <div className="table-container">
                <table className="tools-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Name</th><th>Ref</th><th>Category</th><th>Status</th><th>Risk</th><th>Location</th><th>Photo</th><th>Doc</th><th>Détails</th><th className="sticky-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tools.length > 0 ? tools.map((tool) => (
                      <tr key={tool.id}>
                        <td>{tool.id}</td>
                        <td><strong>{tool.name}</strong></td>
                        <td>{tool.internalReference}</td>
                        <td>{tool.category}</td>
                        <td><span className={`status-badge ${tool.status.toLowerCase().replace(" ", "-")}`}>{tool.status}</span></td>
                        <td><span className={`risk-badge ${tool.riskLevel.toLowerCase()}`}>{tool.riskLevel}</span></td>
                        <td>{tool.location}</td>
                        <td className="text-center">{tool.image ? <ImageIcon className="clickable-icon-img" onClick={() => setSelectedImage(tool.image.url)} size={20} /> : "-"}</td>
                        <td className="text-center">
        {tool.technicalDoc ? (
          <a href={tool.technicalDoc.url} target="_blank" rel="noreferrer">
            <FileText className="clickable-icon-doc" size={20} style={{ color: '#3b82f6', cursor: 'pointer' }} />
          </a>
        ) : "-"}
      </td>
                        <td className="text-center"><button onClick={() => setViewingTool(tool)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa' }}><Search size={20} /></button></td>
                        <td className="sticky-actions">
                          <div className="actions-cell">
                            <button className="btn-edit" onClick={() => handleEdit(tool)}><Edit2 size={14} /></button>
                            <button className="btn-delete" onClick={() => handleDelete(tool.id)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="11" style={{textAlign: 'center', padding: '20px', color: '#666'}}>No tools found. Click "Add Tool" to start.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "tools" && (
          <div className="tools-view">
            
            <div className="title-section-with-btn">
              <h2 className="nature-title">Tools Management</h2>
              <button className="add-btn-inline" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Add Tool</button>
            </div>
            <div className="table-container">
              <table className="tools-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Ref</th><th>Category</th><th>Supplier</th><th>Status</th><th>Risk</th><th>Location</th><th>Comm. Date</th><th>Last Maint.</th><th>Cost (€)</th><th>Photo</th><th>Doc</th><th>Détails</th><th className="sticky-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map((tool) => (
                    <tr key={tool.id}>
                      <td>{tool.id}</td>
                      <td><strong>{tool.name}</strong></td>
                      <td>{tool.internalReference}</td>
                      <td>{tool.category}</td>
                      <td>{tool.supplier}</td>
                      <td><span className={`status-badge ${tool.status.toLowerCase().replace(" ", "-")}`}>{tool.status}</span></td>
                      <td><span className={`risk-badge ${tool.riskLevel.toLowerCase()}`}>{tool.riskLevel}</span></td>
                      <td>{tool.location}</td>
                      <td>{tool.commissioningDate}</td>
                      <td>{tool.lastMaintenance}</td>
                      <td>{tool.purchasePrice}</td>
                      <td className="text-center">{tool.image ? <ImageIcon className="clickable-icon-img" onClick={() => setSelectedImage(tool.image.url)} size={20} /> : "-"}</td>
                      <td className="text-center">{tool.technicalDoc ? <a href={tool.technicalDoc.url} target="_blank" rel="noreferrer"><FileText className="clickable-icon-doc" size={20} /></a> : "-"}</td>
                      <td className="text-center"><button onClick={() => setViewingTool(tool)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa' }}><Search size={20} /></button></td>
                      <td className="sticky-actions">
                        <div className="actions-cell">
                          <button className="btn-edit" onClick={() => handleEdit(tool)}><Edit2 size={14} /></button>
                          <button className="btn-delete" onClick={() => handleDelete(tool.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="tools-view">
            <div className="title-section-with-btn">
              <h2 className="nature-title">Event History</h2>
              <button className="add-btn-inline" onClick={() => setIsLogModalOpen(true)}><Plus size={18} /> Log Event</button>
            </div>
            <div className="table-container">
              <table className="tools-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Tool ID</th><th>Tool Name</th><th>Event</th><th>Reason</th><th>Technician</th><th>Cost (€)</th><th>Downtime</th><th>Parts</th><th>New Status</th><th className="sticky-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((event) => (
                    <tr key={event.id}>
                      <td>{event.date}</td><td>{event.toolId}</td><td>{event.toolName}</td><td>{event.eventType}</td><td>{event.reason}</td><td>{event.technician}</td><td>{event.cost}</td><td>{event.downtime}</td><td>{event.partsReplaced}</td><td>{event.newStatus}</td>
                      <td className="sticky-actions"><button className="btn-edit"><FileText size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* --- TOUTES LES MODALES CI-DESSOUS RESTENT IDENTIQUES --- */}
      {selectedImage && (
        <div className="lightbox-overlay" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-content"><img src={selectedImage} alt="View" /><button className="close-lightbox"><X size={30} /></button></div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content full-modal">
            <div className="modal-header"><h3>Add New Tool</h3><button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button></div>
            <form onSubmit={handleAddTool} className="modal-form">
              <div className="form-section-title">General & Identification</div>
              <div className="form-row">
                <div className="form-group"><label>Name</label><input type="text" required value={newTool.name} onChange={(e) => setNewTool({...newTool, name: e.target.value})} /></div>
                <div className="form-group"><label>Reference</label><input type="text" required value={newTool.internalReference} onChange={(e) => setNewTool({...newTool, internalReference: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group">
  <label>Category</label>
  <select 
    value={newTool.category} 
    onChange={(e) => setNewTool({...newTool, category: e.target.value})}
    required
  >
    <option value="">Select...</option>
    <option value="Pneumatic">Pneumatic</option>
    <option value="Hydraulic">Hydraulic</option>
    <option value="Electric">Electric</option>
    <option value="Mechanical">Mechanical</option>
  </select>
</div>
<div className="form-group"><label>Supplier</label><input type="text" value={newTool.supplier} onChange={(e) => setNewTool({...newTool, supplier: e.target.value})} /></div>
                <div className="form-group"><label>Date
                  </label><input type="date" value={newTool.commissioningDate} onChange={(e) => setNewTool({...newTool, commissioningDate: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Description</label><textarea rows="1" value={newTool.description} onChange={(e) => setNewTool({...newTool, description: e.target.value})} /></div>
              <div className="form-section-title">Usage & Maintenance</div>
              <div className="form-row">
                <div className="form-group"><label>Lifecycle (ans)</label><input type="number" value={newTool.estimatedLifespan} onChange={(e) => setNewTool({...newTool, estimatedLifespan: e.target.value})} /></div>
                <div className="form-group"><label>Status</label><select value={newTool.status} onChange={(e) => setNewTool({...newTool, status: e.target.value})}><option>In Service</option><option>Broken</option><option>End of Life</option></select></div>
                <div className="form-group"><label>Frequency</label><input type="text" value={newTool.usageFrequency} onChange={(e) => setNewTool({...newTool, usageFrequency: e.target.value})} /></div>                <div className="form-group"><label>Risque</label><select value={newTool.riskLevel} onChange={(e) => setNewTool({...newTool, riskLevel: e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Last Maint.</label><input type="date" value={newTool.lastMaintenance} onChange={(e) => setNewTool({...newTool, lastMaintenance: e.target.value})} /></div>
                <div className="form-group"><label>Next Maint.</label><input type="date" value={newTool.nextMaintenance} onChange={(e) => setNewTool({...newTool, nextMaintenance: e.target.value})} /></div>
              </div>
              <div className="form-section-title">Location & Finance</div>
              <div className="form-row">
                <div className="form-group">
  <label>Asset Location</label>
  <select 
    value={newTool.location} 
    onChange={(e) => setNewTool({...newTool, location: e.target.value})}
  >
    <option value="Location 1">Location 1</option>
    <option value="Location 2">Location 2</option>
    <option value="Location 3">Location 3</option>
    <option value="Location 4">Location 4</option>
    <option value="Other">Other</option>
  </select>
</div><div className="form-group"><label>Stat</label><input type="text" value={newTool.generalCondition} onChange={(e) => setNewTool({...newTool, generalCondition: e.target.value})} /></div>
                <div className="form-group"><label>Purchase Price (€)</label><input type="number" value={newTool.purchasePrice} onChange={(e) => setNewTool({...newTool, purchasePrice: e.target.value})} /></div>
                <div className="form-group"><label>Maintenance Cost (€)</label><input type="number" value={newTool.maintenanceCost} onChange={(e) => setNewTool({...newTool, maintenanceCost: e.target.value})} /></div>
              </div>
              <div className="form-section-title">Attachments</div>
              <div className="form-row">
                <div className="form-group"><label>Photo</label><input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "image")} /></div>
                <div className="form-group"><label>Doc PDF</label><input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, "technicalDoc")} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn-black" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="save-btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTool && (
        <div className="modal-overlay">
          <div className="modal-content full-modal">
            <div className="modal-header"><h3>Update Tool : {editingTool.name}</h3><button className="close-btn" onClick={() => setEditingTool(null)}><X size={20} /></button></div>
            <form onSubmit={handleUpdateTool} className="modal-form">
              <div className="form-section-title">General & Identification</div>
              <div className="form-row">
                <div className="form-group"><label>Name</label><input type="text" required value={editingTool.name || ""} onChange={(e) => setEditingTool({...editingTool, name: e.target.value})} /></div>
                <div className="form-group"><label>Refrence</label><input type="text" required value={editingTool.internalReference || ""} onChange={(e) => setEditingTool({...editingTool, internalReference: e.target.value})} /></div>
                </div>
              <div className="form-row">
                <div className="form-group">
  <label>Category</label>
  <select 
    value={newTool.category} 
    onChange={(e) => setNewTool({...newTool, category: e.target.value})}
    required
  >
    <option value="">Select...</option>
    <option value="Pneumatic">Pneumatic</option>
    <option value="Hydraulic">Hydraulic</option>
    <option value="Electric">Electric</option>
    <option value="Mechanical">Mechanical</option>
  </select>
</div>
<div className="form-group"><label>Fournisseur</label><input type="text" value={editingTool.supplier || ""} onChange={(e) => setEditingTool({...editingTool, supplier: e.target.value})} /></div>
                <div className="form-group"><label>In-service date</label><input type="date" value={editingTool.commissioningDate || ""} onChange={(e) => setEditingTool({...editingTool, commissioningDate: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Description</label><textarea rows="1" value={editingTool.description || ""} onChange={(e) => setEditingTool({...editingTool, description: e.target.value})} /></div>
              <div className="form-section-title">Usage & Maintenance</div>
              <div className="form-row">
                <div className="form-group"><label>Lifecycle(ans)</label><input type="number" value={editingTool.estimatedLifespan || ""} onChange={(e) => setEditingTool({...editingTool, estimatedLifespan: e.target.value})} /></div>
                <div className="form-group"><label>Status</label><select value={editingTool.status} onChange={(e) => setEditingTool({...editingTool, status: e.target.value})}><option>In Service</option><option>Broken</option><option>End of Life</option></select></div>
                <div className="form-group"><label>Frequency</label><input type="text" value={editingTool.usageFrequency || ""} onChange={(e) => setEditingTool({...editingTool, usageFrequency: e.target.value})} /></div>
               <div className="form-group"><label>Risque</label><select value={editingTool.riskLevel} onChange={(e) => setEditingTool({...editingTool, riskLevel: e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Last Maint.</label><input type="date" value={editingTool.lastMaintenance || ""} onChange={(e) => setEditingTool({...editingTool, lastMaintenance: e.target.value})} /></div>
                <div className="form-group"><label>Next Maint.</label><input type="date" value={editingTool.nextMaintenance || ""} onChange={(e) => setEditingTool({...editingTool, nextMaintenance: e.target.value})} /></div>
               </div>
              <div className="form-section-title">Location & Finance</div>
              <div className="form-row">
                <div className="form-group"><label>Asset location</label><input type="text" value={editingTool.location || ""} onChange={(e) => setEditingTool({...editingTool, location: e.target.value})} /></div>
                <div className="form-group"><label>Status</label><input type="text" value={editingTool.generalCondition || ""} onChange={(e) => setEditingTool({...editingTool, generalCondition: e.target.value})} /></div>
                <div className="form-group"><label>Purchase Price (€)</label><input type="number" value={editingTool.purchasePrice || ""} onChange={(e) => setEditingTool({...editingTool, purchasePrice: e.target.value})} /></div>
                <div className="form-group"><label>Maintenance cost (€)</label><input type="number" value={editingTool.maintenanceCost || ""} onChange={(e) => setEditingTool({...editingTool, maintenanceCost: e.target.value})} /></div>
              </div>
              <div className="form-section-title">Attachments</div>
              <div className="form-row">
                <div className="form-group"><label>Photo</label>{editingTool.image && <span style={{fontSize: '11px', color: '#3b82f6'}}>{editingTool.image.name}</span>}<input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "image", true)} /></div>
                <div className="form-group"><label>Doc PDF</label>{editingTool.technicalDoc && <span style={{fontSize: '11px', color: '#3b82f6'}}>{editingTool.technicalDoc.name}</span>}<input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, "technicalDoc", true)} /></div>
              </div>
              <div className="modal-footer"><button type="button" className="cancel-btn-black" onClick={() => setEditingTool(null)}>Cancel</button><button type="submit" className="save-btn">Mettre à jour</button></div>
            </form>
          </div>
        </div>
      )}

      {isLogModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content full-modal">
            <div className="modal-header"><h3>Log Event</h3><button className="close-btn" onClick={() => setIsLogModalOpen(false)}><X size={20} /></button></div>
            <form onSubmit={handleLogEvent} className="modal-form">
              <div className="form-row">
                <div className="form-group">
  <label>ID Outil</label>
  <select 
    required 
    value={newEvent.toolId} 
    onChange={(e) => {
      const selectedTool = tools.find(t => t.id === e.target.value);
      setNewEvent({
        ...newEvent, 
        toolId: e.target.value,
        toolName: selectedTool ? selectedTool.name : "", // Remplissage auto du nom
        reference: selectedTool ? selectedTool.internalReference : "" // Remplissage auto de la réf
      });
    }}
  >
    <option value="">Choose a tool...</option>
    {tools.map(tool => (
      <option key={tool.id} value={tool.id}>
        {tool.id} - {tool.name}
      </option>
    ))}
  </select>
</div>
<div className="form-group"><label>Tool Name</label><input type="text" value={newEvent.toolName} onChange={(e) => setNewEvent({...newEvent, toolName: e.target.value})} /></div>
                <div className="form-group"><label>Reference</label><input type="text" value={newEvent.reference} onChange={(e) => setNewEvent({...newEvent, reference: e.target.value})} /></div>
              <div className="form-group"><label>Technician</label><input type="text" required value={newEvent.technician} onChange={(e) => setNewEvent({...newEvent, technician: e.target.value})} /></div>
                </div>
              <div className="form-row">
                <div className="form-group">
                  
  <label>Category</label>
  <select 
    value={newTool.category} 
    onChange={(e) => setNewTool({...newTool, category: e.target.value})}
    required
  >
    <option value="">Select...</option>
    <option value="Pneumatic">Pneumatic</option>
    <option value="Hydraulic">Hydraulic</option>
    <option value="Electric">Electric</option>
    <option value="Mechanical">Mechanical</option>
  </select>
</div>

<div className="form-group"><label>Reason</label><input type="text" value={newEvent.reason} onChange={(e) => setNewEvent({...newEvent, reason: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Maintenance Details</label><textarea rows="2" value={newEvent.details} onChange={(e) => setNewEvent({...newEvent, details: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label>Date</label><input type="date" required value={newEvent.date} onChange={(e) => setNewEvent({...newEvent, date: e.target.value})} /></div>
                <div className="form-group"><label>Cost (€)</label><input type="number" value={newEvent.cost} onChange={(e) => setNewEvent({...newEvent, cost: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Downtime</label><input type="text" value={newEvent.downtime} onChange={(e) => setNewEvent({...newEvent, downtime: e.target.value})} /></div>
                <div className="form-group"><label>Parts Replaced</label><input type="text" value={newEvent.partsReplaced} onChange={(e) => setNewEvent({...newEvent, partsReplaced: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Previous Status</label><input type="text" value={newEvent.oldStatus} onChange={(e) => setNewEvent({...newEvent, oldStatus: e.target.value})} /></div>
                <div className="form-group"><label>New Status</label><input type="text" value={newEvent.newStatus} onChange={(e) => setNewEvent({...newEvent, newStatus: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Comments</label><input type="text" value={newEvent.comments} onChange={(e) => setNewEvent({...newEvent, comments: e.target.value})} /></div>
              <div className="modal-footer"><button type="button" className="cancel-btn-black" onClick={() => setIsLogModalOpen(false)}>Cancel</button><button type="submit" className="save-btn">Log Event</button></div>
            </form>
          </div>
        </div>
      )}

      {viewingTool && (
        <div className="modal-overlay">
          <div className="modal-content detail-modal-dark" style={{backgroundColor: '#121418', color: 'white', maxWidth: '800px', borderRadius: '12px', padding: '30px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px'}}>
              <div><h2 style={{fontSize: '1.8rem', margin: 0}}>{viewingTool.name}</h2><span style={{color: '#666'}}>{viewingTool.internalReference || viewingTool.id}</span></div>
              <button onClick={() => setViewingTool(null)} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}><X size={24}/></button>
            </div>
            <h3 style={{fontSize: '1.1rem', marginBottom: '20px', color: '#eee'}}>Informations Générales</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '40px'}}>
              <div><label style={{color: '#555', fontSize: '0.8rem', textTransform: 'uppercase'}}>Catégorie</label><p style={{margin: '5px 0', fontSize: '1.1rem'}}><strong>{viewingTool.category}</strong></p></div>
              <div><label style={{color: '#555', fontSize: '0.8rem', textTransform: 'uppercase'}}>Statut</label><div style={{marginTop: '5px'}}><span className={`status-badge ${viewingTool.status.toLowerCase().replace(" ", "-")}`}>{viewingTool.status}</span></div></div>
              <div><label style={{color: '#555', fontSize: '0.8rem', textTransform: 'uppercase'}}>Localisation</label><p style={{margin: '5px 0', fontSize: '1.1rem'}}><strong>{viewingTool.location}</strong></p></div>
              <div><label style={{color: '#555', fontSize: '0.8rem', textTransform: 'uppercase'}}>Date d'achat</label><p style={{margin: '5px 0', fontSize: '1.1rem'}}><strong>{viewingTool.commissioningDate}</strong></p></div>
              <div><label style={{color: '#555', fontSize: '0.8rem', textTransform: 'uppercase'}}>Prix d'achat</label><p style={{margin: '5px 0', fontSize: '1.1rem', color: '#3b82f6'}}><strong>{viewingTool.purchasePrice}€</strong></p></div>
              <div><label style={{color: '#555', fontSize: '0.8rem', textTransform: 'uppercase'}}>Risque</label><p style={{margin: '5px 0', fontSize: '1.1rem'}}><strong>{viewingTool.riskLevel}</strong></p></div>
            </div>
            <h3 style={{fontSize: '1.1rem', marginBottom: '20px', borderTop: '1px solid #222', paddingTop: '20px'}}>Historique des Événements</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              {toolHistory.length > 0 ? toolHistory.map(h => (
                <div key={h.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1a1a1a'}}>
                   <span style={{color: '#666'}}>{h.date}</span><span style={{backgroundColor: 'rgba(5, 150, 105, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px'}}>{h.eventType}</span><span>{h.reason}</span><span style={{color: '#666'}}>{h.technician}</span>
                </div>
              )) : <p style={{color: '#444', textAlign: 'center'}}>Aucun événement enregistré.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;