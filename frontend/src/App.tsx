
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "../components/Layout";
import Dashboard from "../components/Dashboard";
import ProposalGenerator from "../components/ProposalGenerator";
import VoiceResponder from "../components/VoiceResponder";
import ContractGenerator from "../components/ContractGenerator";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/proposal-generator" element={<ProposalGenerator />} />
          <Route path="/voice-responder" element={<VoiceResponder />} />
          <Route path="/contract-generator" element={<ContractGenerator />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
