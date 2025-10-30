import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from './HomePage';
import ResultPage from './ResultPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element = {<HomePage/>}></Route>
                <Route path="/result-page" element = {<ResultPage/>}></Route>
            </Routes>
        </Router>
    )
}

export default App;