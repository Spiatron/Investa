import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Col, Row, Typography, message } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { Country, State, City } from 'country-state-city';
import PANStepForm from './PANStepForm';
import { useUsername } from './UsernameContext';

const { Option } = Select;
const { Text } = Typography;

const SignupForm = () => {
    const [phoneCode, setPhoneCode] = useState('+91');
    const [isOTPStep, setIsOTPStep] = useState(false);
    const [isPANStep, setIsPANStep] = useState(false);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('IN');
    const [otpString, setOtpString] = useState('');
    const [email, setEmail] = useState(''); // Local email state

    const { setUsername } = useUsername(); // Destructure setUsername from useUsername hook

    useEffect(() => {
        setStates(State.getStatesOfCountry(selectedCountry));
    }, [selectedCountry]);

    const onCountryChange = (value) => {
        const selectedCountryData = Country.getAllCountries().find(country => country.name === value);
        if (selectedCountryData) {
            setPhoneCode(selectedCountryData.phoneCode);
            setSelectedCountry(selectedCountryData.isoCode);
            setStates(State.getStatesOfCountry(selectedCountryData.isoCode));
            setCities([]);
        }
    };

    const onStateChange = (value) => {
        setCities(City.getCitiesOfState(selectedCountry, value));
    };

    const onFinish = async (values) => {
        const fullPhoneNumber = `${phoneCode}${values.mobileNumber}`;
        
        // Get full country name from the selected country ISO code
        const countryName = Country.getAllCountries().find(
            (country) => country.isoCode === selectedCountry
        )?.name;
        
        // Get full state name from the selected state ISO code
        const stateName = State.getStatesOfCountry(selectedCountry).find(
            (state) => state.isoCode === values.state
        )?.name;
    
        const payload = {
            username: values.username,
            email: values.email, // Use the email from form values
            mobileNumber: fullPhoneNumber,
            address: {
                country: countryName, // Full country name
                state: stateName, // Full state name
                city: values.city,
            },
            role: "user", // Set role to 'user' by default
            password: values.password,
        };
    
        console.log('Sending payload: ', payload);
    
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/user/register-step1`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
    
            const result = await response.json();
            console.log('API response:', result);
    
            if (response.ok) {
                setEmail(values.email); // Store the email in local state
                message.success('OTP sent successfully! Check your email for the OTP.');
                setIsOTPStep(true);
                setUsername(values.username);
            } else {
                console.error('Error:', result.error);
                message.error(result.error || 'An unknown error occurred');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            message.error('Fetch error: ' + error.message);
        }
    };

    const handleOTPSubmit = async () => {
        const payload = {
            email, // Use the locally stored email
            otp: otpString,
        };
        console.log('Sending OTP payload:', payload);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/user/finalizeInitialRegistration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            console.log('API response:', result);

            if (response.ok) {
                message.success('OTP verified successfully! Proceeding to the next step.');
                setIsPANStep(true);
                localStorage.setItem("userObjectID", result.user.userObjectID);
                console.log(localStorage.getItem("userObjectID"));
            } else {
                message.error(`Error: ${result.error}. Kindly Start over`);
                setIsOTPStep(false);
                console.error('Error:', result.error);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            setIsOTPStep(false);
            message.error('Fetch error: ' + error.message);
        }
    };

    const handleOTPChange = (e) => {
        const value = e.target.value;
        if (value.length <= 6) {
            setOtpString(value); // Update OTP string
        }
    };

    // Inline styles
    const containerStyle = {
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ebebeb',
        padding: '0 20px',
    };

    const formBoxStyle = {
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '500px',
    };

    return (
        <>
            {isPANStep ? (
                <PANStepForm />
            ) : (
                <div style={containerStyle}>
                    <Col xs={24} sm={16} md={12} lg={8}>
                        <div style={formBoxStyle}>
                            {!isOTPStep ? (
                                <Form
                                    name="signup"
                                    onFinish={onFinish}
                                    layout="vertical"
                                    initialValues={{ country: "India" }}
                                >
                                    {/* Signup form elements */}
                                    <Form.Item
                                        name="email"
                                        label="Email Address"
                                        rules={[
                                            { required: true, message: 'Please input your email address!' },
                                            { type: 'email', message: "Please include an '@' in your email address!" }
                                        ]}
                                    >
                                        <Input
                                            prefix={<MailOutlined />}
                                            placeholder="Enter your email address"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="username"
                                        label="Username"
                                        rules={[{ required: true, message: 'Please input your username!' }]}
                                    >
                                        <Input
                                            prefix={<UserOutlined />}
                                            placeholder="Enter your username"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="password"
                                        label="Password"
                                        rules={[
                                            { required: true, message: 'Please input your password!' },
                                            { min: 8, message: 'Password must be at least 8 characters long!' }
                                        ]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined />}
                                            placeholder="Enter your password"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="confirmPassword"
                                        label="Confirm Password"
                                        dependencies={['password']}
                                        rules={[
                                            { required: true, message: 'Please confirm your password!' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('password') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Passwords do not match!'));
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined />}
                                            placeholder="Confirm your password"
                                        />
                                    </Form.Item>

                                    {/* Country, State, and City */}
                                    <Row gutter={16}>
                                        <Col xs={24} sm={8}>
                                            <Form.Item
                                                name="country"
                                                label="Country"
                                                rules={[{ required: true, message: 'Please select your country!' }]}
                                            >
                                                <Select
                                                    placeholder="Select your country"
                                                    showSearch
                                                    optionFilterProp="children"
                                                    onChange={onCountryChange}
                                                    defaultValue="India"
                                                    disabled
                                                >
                                                    {Country.getAllCountries().map((country) => (
                                                        <Option key={country.isoCode} value={country.name}>
                                                            {country.name}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} sm={8}>
                                            <Form.Item
                                                name="state"
                                                label="State"
                                                rules={[{ required: true, message: 'Please select your state!' }]}
                                            >
                                                <Select
                                                    placeholder="Select your state"
                                                    onChange={onStateChange}
                                                >
                                                    {states.map((state) => (
                                                        <Option key={state.isoCode} value={state.isoCode}>
                                                            {state.name}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} sm={8}>
                                            <Form.Item
                                                name="city"
                                                label="City"
                                                rules={[{ required: true, message: 'Please select your city!' }]}
                                            >
                                                <Select placeholder="Select your city">
                                                    {cities.map((city) => (
                                                        <Option key={city.id} value={city.name}>
                                                            {city.name}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item
                                        name="mobileNumber"
                                        label="Mobile Number"
                                        rules={[{ required: true, message: 'Please input your mobile number!' }]}
                                    >
                                        <Input
                                            prefix={<PhoneOutlined />}
                                            placeholder="Enter your mobile number"
                                            addonBefore={phoneCode}
                                        />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                                            Sign Up
                                        </Button>
                                    </Form.Item>
                                </Form>
                            ) : (
                                <>
                                    <Text type="success">OTP has been sent to your email. Kindly check!</Text>
                                    <Form onFinish={handleOTPSubmit}>
                                        <Form.Item
                                            label="Enter 6-digit OTP"
                                            required
                                            rules={[
                                                { required: true, message: 'Please enter the OTP!' },
                                                { len: 6, message: 'OTP must be exactly 6 digits!' },
                                            ]}
                                        >
                                            <Input
                                                value={otpString}
                                                onChange={handleOTPChange}
                                                maxLength={6}
                                                placeholder="Enter 6-digit OTP"
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>

                                        <Form.Item>
                                            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                                                Submit OTP
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                </>
                            )}
                        </div>
                    </Col>
                </div>
            )}
        </>
    );
};

export default SignupForm;
