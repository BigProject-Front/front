import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../navbar/navbar';
import DetailModal from './modal_admin.jsx';
import DetailImages from './DetailImage.jsx';
import { getChangeLog, makeChangeLog } from '../../service/apiService.js';
import './detail.css';

// 날짜함수
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
};

// 시간함수
const formatTime = (timeString) => {
  const time = new Date(`1970-01-01T${timeString}Z`);
  let hours = time.getHours();
  const minutes = time.getMinutes();
  const period = hours >= 12 ? '오후' : '오전';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedTime = `${period} ${hours}:${minutes.toString().padStart(2, '0')}`;
  return formattedTime;
};

// 상세 정보 페이지
const DetailAdmin = () => {
  const navigate = useNavigate();
  const { farm_id } = useParams();

  const [landDetail, setLandDetail] = useState({
    farm_id: 0,
    farm_name: '',
    farm_owner: '',
    farm_size: 0,
    latitude: 0,
    longitude: 0,
    image: null,
  });

  const [landLog, setLandLog] = useState({
    farm_status: 0,
    farm_created: '',
    user_id: 0
  });

  //농지 상세정보 변수
  const [farmDate, setFarmDate] = useState('');
  const [farmTime, setFarmTime] = useState('');
  const [farmStatusText, setFarmStatusText] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logData, setLogData] = useState(null);
  const [loading, setLoading] = useState(false); // 로딩 상태 추가

  // 이미지 로딩 상태
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!farm_id) return;
    // 사용자가 로그인할 때 저장된 토큰
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`http://3.39.228.42:8080/farms/admin/detail/${farm_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error();
        }
      })
      .then(data => {
        console.log('data:', data);
        setLandDetail({
          farm_id: data.farm_id,
          farm_name: data.farm_name,
          farm_owner: data.farm_owner,
          farm_size: data.farm_size,
          latitude: data.latitude,
          longitude: data.longitude,
          image: data.image ? { farm_image: data.image.farm_image } : null
        });

        //날짜 및 시간
        setLandLog(data.status_logs[0]);
        setFarmDate(formatDate(data.status_logs[0].farm_created));
        setFarmTime(formatTime(data.status_logs[0].farm_created.split('T')[1].split('Z')[0]));

        //분양 상태 설정
        if (data.status_logs.length > 0) {
          const lastLog = data.status_logs[data.status_logs.length - 1];
          
          if (lastLog.farm_status === 0) {
            setFarmStatusText('확인 이전');
          } else if (lastLog.farm_status === 1) {
            setFarmStatusText('확인 완료');
          } else if (lastLog.farm_status === 2) {
            setFarmStatusText('분양 신청');
          } else if (lastLog.farm_status === 3) {
            setFarmStatusText('분양(승인) 완료')
          } else {
            setFarmStatusText('알 수 없음');
          }
        }
      })
      // 로컬 스토리지에만 토큰이 남아있어도 로그인 페이지로 유도 가능
      .catch(error => {
        navigate('/session');
      });
    } else {
      navigate('/login');
    }
  }, [farm_id, navigate]);

  const handleBackClick = () => {
    localStorage.setItem('currentFarmId', farm_id);
    navigate('/listadmin');
  }

  const handleChangeLogClick = () => {
    if (isModalOpen) return; // 모달이 열려 있으면 로딩 오버레이를 표시하지 않음

    const token = localStorage.getItem('token');
    if (token) {
      setLoading(true); // 로딩 상태 시작
      makeChangeLog(farm_id, token)
        .then(() => getChangeLog(farm_id, token))
        .then(data => {
          console.log('Change Log Data:', data); // 변경 로그 데이터 확인
          setLogData(data);
          setIsModalOpen(true);
        })
        .catch(error => {
          console.error('Error:', error);
        })
        .finally(() => {
          setLoading(false); // 로딩 상태 종료
        });
    }
  };

  return (
    <div className="page">
      <Navbar />
      <div className="detailpage">
        <div className="detail-container">
          <div className="detail-info">
            <div className="detail-title">농지 상세정보</div>
            <div className="details">
                <span className="d-info" info-title="농지명">
                  <span>{landDetail.farm_name}</span>
                </span>
                <span className="d-info" info-title="지목">
                  <span>{landDetail.farm_owner}</span>
                </span>
                <span className="d-info" info-title="위도 / 경도">
                  <span>
                    {landDetail.latitude}, {landDetail.longitude}
                  </span>
                </span>
                <span className="d-info" info-title="농지 크기">
                  <span>{landDetail.farm_size}</span>
                </span>
                <span className="d-info" info-title="게시 날짜">
                  <span>{farmDate}</span>
                </span>
                <span className="d-info" info-title="게시 시간">
                  <span>{farmTime}</span>
                </span>
                <span className="d-info" info-title="농지 상태">
                  <span>{farmStatusText}</span>
                </span>
                <div className="btn">
                  <button onClick={handleBackClick} className="backBtn">
                    이전
                  </button>
                  <button onClick={handleChangeLogClick} className="changeBtn">
                    변화탐지 확인
                  </button>
                </div>
              </div>
          </div>
  
          <div className="map">
            {landDetail.image && !imageError ? (
              <img
                src={landDetail.image.farm_image}
                alt="FarmImg"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            ) : (
              !imageLoaded && <p className='loading'>이미지를 로딩 중입니다...</p>
            )}
            {imageError && <p className='noImg'>이미지가 등록되지 않았습니다.</p>}
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-popup">
            <p>변화 탐지 모델 생성 중...</p>
          </div>
        </div>
      )}

      <DetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DetailImages logData={logData} />
      </DetailModal>

    </div>
  );
};
 
export default DetailAdmin;
