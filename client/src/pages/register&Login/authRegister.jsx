import React, { useState } from 'react';
import { AuthAPI, setAuthToken } from '../../config/api';

const AuthRegister = () => {
	const [tab, setTab] = useState('register');

	// Register state
	const [form, setForm] = useState({
		fullName: '',
		mail_ID: '',
		phoneNo: '',
		college: '',
		branch: '',
		year: '',
		PaymentAddress: '',
		dob: '',
		emailOTP: '',
		phoneOTP: '',
	});
	const [sendingOtp, setSendingOtp] = useState(false);
	const [registering, setRegistering] = useState(false);
	const [message, setMessage] = useState(null);
	const [error, setError] = useState(null);

	// Login state
	const [loginForm, setLoginForm] = useState({ student_ID: '', dob: '' });
	const [loggingIn, setLoggingIn] = useState(false);

	// Dropdown options
	const streamOptions = [
		'Computer Science & Engineering',
		'Electronics & Communication',
		'Mechanical Engineering',
		'Civil Engineering',
		'Electrical Engineering',
		'Information Technology',
		'Artificial Intelligence',
		'Data Science',
		'Business Administration',
		'Commerce',
		'Science',
		'Arts',
		'Other'
	];

	const yearOptions = [
		'1st Year',
		'2nd Year', 
		'3rd Year',
		'4th Year'
	];

	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
	const handleLoginChange = (e) => setLoginForm({ ...loginForm, [e.target.name]: e.target.value });

	const onSendOTP = async () => {
		setError(null);
		setMessage(null);
		if (!form.fullName || !form.mail_ID || !form.phoneNo) {
			setError('Full name, email and phone number are required to send OTPs');
			return;
		}
		try {
			setSendingOtp(true);
			await AuthAPI.sendOTP({ fullName: form.fullName, mail_ID: form.mail_ID, phoneNo: form.phoneNo });
			setMessage('OTPs sent to the provided email and phone. Please check and enter them below.');
		} catch (err) {
			setError(err?.response?.data?.message || err.message || 'Failed to send OTP');
		} finally {
			setSendingOtp(false);
		}
	};

	const onRegister = async () => {
		setError(null);
		setMessage(null);
		const required = ['fullName','mail_ID','phoneNo','college','branch','year','dob','emailOTP','phoneOTP'];
		for (const k of required) if (!form[k]) return setError('Please fill all required fields and OTPs');

		try {
			setRegistering(true);
			const payload = {
				fullName: form.fullName,
				mail_ID: form.mail_ID,
				phoneNo: form.phoneNo,
				college: form.college,
				branch: form.branch,
				year: form.year,
				dob: form.dob,
				emailOTP: form.emailOTP,
				phoneOTP: form.phoneOTP,
			};

			const res = await AuthAPI.register(payload);
			setMessage(res?.data?.message || 'Registered successfully');
			setTab('login');
		} catch (err) {
			setError(err?.response?.data?.message || err.message || 'Registration failed');
		} finally {
			setRegistering(false);
		}
	};

	const onLogin = async () => {
		setError(null);
		setMessage(null);
		if (!loginForm.student_ID || !loginForm.dob) return setError('Student ID and DOB are required');
		try {
			setLoggingIn(true);
			const res = await AuthAPI.login(loginForm);
			const token = res?.data?.token;
			if (token) {
				localStorage.setItem('token', token);
				setAuthToken(token);
			}
			setMessage(res?.data?.message || 'Login successful');
		} catch (err) {
			setError(err?.response?.data?.message || err.message || 'Login failed');
		} finally {
			setLoggingIn(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="text-center mb-12">
					<div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
						<svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l-9 5m9-5v6" />
						</svg>
					</div>
					<h1 className="text-4xl font-bold text-gray-900 mb-3 font-sans">EduConnect</h1>
					<p className="text-gray-600 text-lg font-light">India's Premier Learning Platform</p>
				</div>

				{/* Card */}
				<div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100/50">
					{/* Tab Header */}
					<div className="flex border-b border-gray-200">
						<button 
							onClick={() => setTab('register')} 
							className={`flex-1 py-5 text-center font-medium text-base transition-all duration-300 relative ${
								tab === 'register' 
									? 'text-blue-600 bg-blue-50/50 font-semibold' 
									: 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
							}`}
						>
							Create Account
							{tab === 'register' && (
								<div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
							)}
						</button>
						<button 
							onClick={() => setTab('login')} 
							className={`flex-1 py-5 text-center font-medium text-base transition-all duration-300 relative ${
								tab === 'login' 
									? 'text-blue-600 bg-blue-50/50 font-semibold' 
									: 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
							}`}
						>
							Sign In
							{tab === 'login' && (
								<div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
							)}
						</button>
					</div>

					{/* Content */}
					<div className="p-8">
						{/* Messages */}
						{message && (
							<div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
								<svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
								<span className="text-green-800 text-sm">{message}</span>
							</div>
						)}
						
						{error && (
							<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
								<svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
								</svg>
								<span className="text-red-800 text-sm">{error}</span>
							</div>
						)}

						{/* Register Form */}
						{tab === 'register' && (
							<div className="space-y-8">
								{/* Personal Information */}
								<div className="space-y-6">
									<h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="md:col-span-2">
											<label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
											<input 
												name="fullName" 
												value={form.fullName} 
												onChange={handleChange} 
												placeholder="Enter your full name" 
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-400"
											/>
										</div>
										
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
											<input 
												name="mail_ID" 
												type="email"
												value={form.mail_ID} 
												onChange={handleChange} 
												placeholder="your@email.com" 
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-400"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
											<input 
												name="phoneNo" 
												value={form.phoneNo} 
												onChange={handleChange} 
												placeholder="+91 9876543210" 
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-400"
											/>
										</div>
									</div>
								</div>

								{/* Academic Information */}
								<div className="space-y-6">
									<h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="md:col-span-2">
											<label className="block text-sm font-medium text-gray-700 mb-2">College Name *</label>
											<input 
												name="college" 
												value={form.college} 
												onChange={handleChange} 
												placeholder="Enter your college name" 
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-400"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Branch *</label>
											<select 
												name="branch" 
												value={form.branch} 
												onChange={handleChange}
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white appearance-none cursor-pointer"
											>
												<option value="">Select your branch</option>
												{streamOptions.map((s) => (
													<option key={s} value={s}>{s}</option>
												))}
											</select>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
											<select 
												name="year" 
												value={form.year} 
												onChange={handleChange}
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white appearance-none cursor-pointer"
											>
												<option value="">Select year</option>
												{yearOptions.map((year) => (
													<option key={year} value={year}>{year}</option>
												))}
											</select>
										</div>
									</div>
								</div>

								{/* Payment & Security */}
								<div className="space-y-6">
									<h3 className="text-lg font-semibold text-gray-900">Payment & Security</h3>
									<div className="grid grid-cols-1 gap-6">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Payment Address (UPI/Wallet) *</label>
											<input 
												name="PaymentAddress" 
												value={form.PaymentAddress} 
												onChange={handleChange} 
												placeholder="UPI ID or wallet address" 
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-400"
											/>
											<p className="text-xs text-gray-500 mt-2">This will be used for any financial transactions</p>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
											<input 
												name="dob" 
												type="date" 
												value={form.dob} 
												onChange={handleChange} 
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
											/>
										</div>
									</div>
								</div>

								{/* OTP Section */}
								<div className="border-t border-gray-200 pt-8">
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
										<div>
											<h3 className="text-lg font-semibold text-gray-900 mb-1">Verification</h3>
											<p className="text-sm text-gray-600">Verify your email and phone number</p>
										</div>
										<button 
											onClick={onSendOTP} 
											disabled={sendingOtp}
											className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md w-full sm:w-auto"
										>
											{sendingOtp && (
												<svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
											)}
											<span className="text-sm font-medium">{sendingOtp ? 'Sending...' : 'Send OTPs'}</span>
										</button>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Email OTP *</label>
											<input 
												name="emailOTP" 
												value={form.emailOTP} 
												onChange={handleChange} 
												placeholder="Enter 6-digit OTP" 
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-center text-base font-mono tracking-widest placeholder-gray-400"
												maxLength={6}
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Phone OTP *</label>
											<input 
												name="phoneOTP" 
												value={form.phoneOTP} 
												onChange={handleChange} 
												placeholder="Enter 6-digit OTP" 
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-center text-base font-mono tracking-widest placeholder-gray-400"
												maxLength={6}
											/>
										</div>
									</div>
								</div>

								<button 
									onClick={onRegister} 
									disabled={registering}
									className="w-full py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
								>
									{registering && (
										<svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
									)}
									<span>{registering ? 'Creating Account...' : 'Create Account'}</span>
								</button>
							</div>
						)}

						{/* Login Form */}
						{tab === 'login' && (
							<div className="space-y-6">
								<div className="text-center mb-8">
									<h2 className="text-2xl font-semibold text-gray-900">Welcome Back</h2>
									<p className="text-gray-600 mt-2 text-sm">Sign in to continue your learning journey</p>
								</div>

								<div className="space-y-5">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Student ID *</label>
										<input 
											name="student_ID" 
											value={loginForm.student_ID} 
											onChange={handleLoginChange} 
											placeholder="e.g., RICR-RS-0001" 
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-400"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
										<input 
											name="dob" 
											type="date" 
											value={loginForm.dob} 
											onChange={handleLoginChange} 
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
										/>
									</div>
								</div>

								<button 
									onClick={onLogin} 
									disabled={loggingIn}
									className="w-full py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
								>
									{loggingIn && (
										<svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
									)}
									<span>{loggingIn ? 'Signing In...' : 'Sign In'}</span>
								</button>

								<div className="text-center pt-4 border-t border-gray-200">
									<p className="text-gray-600 text-sm">
										Don't have an account?{' '}
										<button 
											onClick={() => setTab('register')} 
											className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
										>
											Create one here
										</button>
									</p>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="text-center mt-8">
					<p className="text-sm text-gray-500">
						© 2024 EduConnect. Empowering students across India.
					</p>
				</div>
			</div>
		</div>
	);
};

export default AuthRegister;