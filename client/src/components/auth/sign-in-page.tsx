import { SignIn } from './sign-in.tsx';

const centreContainer = {
  display: 'flex',
  justifyContent: 'center', /* Center horizontally */
  alignItems: 'center',    /* Center vertically */
  height: '50vh'           /* 100% of the viewport height */
};

const loginDialog = {
  width: '500px',
  padding: '20px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
};

const SignInPage = () => {
  return (
    <div style={centreContainer}>
      <div style={loginDialog}>
        {/*<Tabs*/}
        {/*  defaultActiveKey="sign-in"*/}
        {/*  className="mb-3 h-100"*/}
        {/*  fill>*/}

        {/*<Tab eventKey="sign-in" title="Sign In">*/}
        <SignIn/>
        {/*</Tab>*/}

        {/*<Tab eventKey="sign-up" title="Sign Up">*/}
        {/*  <SignUp/>*/}
        {/*</Tab>*/}

        {/*</Tabs>*/}
      </div>
    </div>
  );
};

export default SignInPage;
