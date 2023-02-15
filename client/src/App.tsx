import React from 'react';
import './App.css';
import VerificationPage from './components/verification-page';
import { Home } from './components/home';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Main } from './components/main';
import { SubmitFile } from './components/submit-file';
import TestForm from './components/test-form';
import { CheckSubmission } from './components/check-submission';
import Sha256Converter from './components/sha-256-converter';
import NetworkPage from './components/network-page';
import { InitiateApprovals } from './components/initiate-approvals';
import { ApproveRegistration } from './components/approve-registration';
import { SignUp } from './components/user/sign-up';
import { ResetPassword } from './components/user/reset-password';
import { SignIn } from './components/user/sign-in';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Main>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/test" element={<TestForm/>}/>
            <Route path="/verify" element={<VerificationPage/>}/>
            <Route path="/check-submission" element={<CheckSubmission/>}/>
            <Route path="/submit-file" element={<SubmitFile/>}/>
            <Route path="/sha-256" element={<Sha256Converter/>}/>
            <Route path="/network" element={<NetworkPage/>}/>
            <Route path="/verify-email" element={<InitiateApprovals/>}/>
            <Route path="/approve-registration" element={<ApproveRegistration/>}/>
            <Route path="/sign-up" element={<SignUp/>}/>
            <Route path="/sign-in" element={<SignIn/>}/>
            <Route path="/reset-password" element={<ResetPassword/>}/>
          </Routes>
        </Main>
      </BrowserRouter>
    </div>
  );
}

export default App;

