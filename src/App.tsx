import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import GoldenHourPage from '@/pages/GoldenHourPage';
import MonitorPage from '@/pages/MonitorPage';
import ReviewPage from '@/pages/ReviewPage';
import ResponsePage from '@/pages/ResponsePage';
import EvidenceLedgerPage from '@/pages/EvidenceLedgerPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/golden-hour" replace />} />
          <Route path="/golden-hour" element={<GoldenHourPage />} />
          <Route path="/monitor" element={<MonitorPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/response" element={<ResponsePage />} />
          <Route path="/evidence" element={<EvidenceLedgerPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
