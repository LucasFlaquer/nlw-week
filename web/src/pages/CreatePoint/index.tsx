import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import logo from '../../assets/logo.svg'
import { FiArrowLeft } from 'react-icons/fi'
import { Map, TileLayer, Marker } from 'react-leaflet'
import api from '../../services/api'
import axios from 'axios'
import { LeafletMouseEvent } from 'leaflet'
import {Link, useHistory} from 'react-router-dom'
import './styles.css'
//sempre que cira um estado para array ou objetoi precisa informar manualmente o tipo da variavel

interface Item {
  id:number,
  title:string,
  image_url:string
}

interface IBGEUFResponse {
  sigla:string
}

interface IBGECityResponse {
  nome:string
}


const CreatePoint = () => {
  const [items, setItems] = useState<Item[]>([])
  const [ufs, setUfs] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [selectedUF, setSelectedUF] = useState('0')
  const [selectedCity, setSelectedCity] = useState('0')
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0])
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0])
  const [formData, setFormData] = useState({
    name:'',
    email:'',
    whatsapp:''
  })
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  const history = useHistory()

  useEffect(()=> {
    navigator.geolocation.getCurrentPosition(position=> {
      const { latitude, longitude } = position.coords
      setInitialPosition([latitude, longitude])
    })
  }, [])

  useEffect(()=> {
    api.get('items').then(response => {
      setItems(response.data)
    })
  }, [])
  useEffect(()=> {
    axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
      const ufInitials = response.data.map(uf=>uf.sigla)
      setUfs(ufInitials)
    })
  }, [])
  useEffect(()=> {
    if(selectedUF === '0')
      return
    axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`)
    .then(response => {
      const cityNames = response.data.map(city=>city.nome)
      setCities(cityNames)
    })
  }, [selectedUF])

  function handleSelectUf(event:ChangeEvent<HTMLSelectElement> ) {
    const uf = event.target.value
    setSelectedUF(uf)
  }

  function handleSelectCity(event:ChangeEvent<HTMLSelectElement> ) {
    const city = event.target.value
    setSelectedCity(city)
  }

  function handleMapClick(event:LeafletMouseEvent) {
    console.log(event)
    setSelectedPosition([event.latlng.lat, event.latlng.lng])
  }

  function handleInputChange(event:ChangeEvent<HTMLInputElement>) {
    const {name, value} = event.target
    setFormData({ ...formData, [name]:value })
  }

  function handleSelectItem(id:number) {
    // para melhorar deixar a lista ordenada
    const alreadySelected = selectedItems.findIndex(item => item === id)
    if(alreadySelected >= 0) {
      const filteredItems = selectedItems.filter(item=>item!== id)
      setSelectedItems(filteredItems)
    } else
      setSelectedItems([...selectedItems, id])

  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const { name, email, whatsapp} = formData
    const uf = selectedUF
    const city = selectedCity
    const [latitude, longitude] = selectedPosition
    const items = selectedItems

    const data = {
      name,
      email,
      whatsapp,
      uf,
      city,
      latitude,
      longitude,
      items
    }
    await api.post('points', data)
    alert('ponto de coleta criado')
    history.push('/')
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta"/>
        <Link to="/">
          <FiArrowLeft/>
          Voltar para a Home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadsatro do <br/> ponto de coleta</h1>
        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>
          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input type="text"
              id="name"
              name="name"
              onChange={handleInputChange}/>
          </div>
          <div className="field-group">
            <div className="field">
              <label htmlFor="">Email</label>
              <input type="email"
                id="email"
                name="email" onChange={handleInputChange}/>
            </div>
            <div className="field">
              <label htmlFor="">Whatsapp</label>
              <input type="text"
                id="whatsapp"
                name="whatsapp"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <h2>Endereco</h2>
            <span>selecione o endereco no mapa</span>
          </legend>

          <Map center={[-23.4935216,-47.408317]} zoom={15} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition}/>
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="UF">Estado (UF)</label>
              <select 
                name="uf" 
                id="uf" 
                value={selectedUF} 
                onChange={handleSelectUf}>
                <option value="0">Selecione uma UF</option>
                {ufs.map(uf=> (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select 
                name="city" 
                id="city"
                value={selectedCity}
                onChange={handleSelectCity}>
                <option value="0">Selecione uma Cidade</option>
                {cities.map(city=> (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>


        </fieldset>
        <fieldset>
          <legend>
            <h2>Items de coleta</h2>
            <span>Selecione um ou mais ítens abaixo</span>
          </legend>

          <ul className="items-grid">
            {items.map(item=> (
              <li key={item.id} onClick={()=>handleSelectItem(item.id)} className={selectedItems.includes(item.id)? 'selected' : ''}>
                <img src={item.image_url} alt={item.title}/>
                <span>{item.title}</span>
              </li>
            ))}
            
          </ul>

        </fieldset>
        <button>Cadastrar ponto de coleta</button>
      </form>
    </div>
  )
}

export default CreatePoint