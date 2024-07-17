import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../navbar/navbar.jsx';
import { getAdminMypage } from '../../service/apiService.js';
import './adminmypage.css';

const AdminMyPage = () => {
	const navigate = useNavigate();
	const [logs, setLogs] = useState([]);

	useEffect(() => {
		const token = localStorage.getItem('token');

		if (token) {
			getAdminMypage(token)
			.then(data => {
				setLogs(data.reverse());
			})
			.catch(error => {
        navigate('/notfound');
      });
    } else {
      navigate('/login');
    }
	}, [navigate]);

	return (
		<>
			<Navbar />
			<div>
				{logs.map((log, index) => (
					<div key={index}>
						<div> {log.farm_created} </div>
						<div> {log.farm_id} </div>
						<div> {log.farm_name} </div>
						<div> {log.farm_status} </div>
						<div> {log.farm_status_log_id} </div>
						<div> {log.user_id} </div>
					</div>
				))}
			</div>
		</>
	)
}

export default AdminMyPage;