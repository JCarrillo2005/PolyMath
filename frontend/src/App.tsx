import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CreateJob from "./pages/CreateJob";
import JobDetail from "./pages/JobDetail";
import Stats from "./pages/Stats";
import { CompareRoots } from "./pages/CompareRoots";
import ComparisonHistory from "./pages/ComparisonHistory";
import { CompareMatrices } from "./pages/CompareMatrices";
import MatrixComparisonHistory from "./pages/MatrixComparisonHistory";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<CreateJob />} />
      <Route path="/job/:jobId" element={<JobDetail />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="/compare" element={<CompareRoots />} />
      <Route path="/compare/:comparisonId" element={<CompareRoots />} />
      <Route path="/compare/history" element={<ComparisonHistory />} />
      <Route path="/compare-matrices" element={<CompareMatrices />} />
      <Route
        path="/compare-matrices/:comparisonId"
        element={<CompareMatrices />}
      />
      <Route
        path="/compare-matrices/history"
        element={<MatrixComparisonHistory />}
      />
    </Routes>
  );
}

export default App;
