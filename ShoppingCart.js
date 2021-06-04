import React, { useState, useEffect, useReducer }  from 'react';
import Card from 'react-bootstrap/Card'
import Accordion from 'react-bootstrap/Accordion'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Image from 'react-bootstrap/Image'
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios'

// simulate getting products from DataBase
const products = [];
//=========Cart=============
const useDataApi = (initialUrl, initialData) => {
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  console.log(`useDataApi called`);

  useEffect(() => {
    console.log("useEffect Called");
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);
        console.log("FETCH FROM URl");
        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
          result.data.map(item=>products.push(item))
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);
  return [state, setUrl];
};

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

const Products = (props) => {
  const [items, setItems] = useState(products);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  //  Fetch Data
  const [query, setQuery] = useState("http://localhost:1337/products");

  const [{ data, isLoading, isError }, doFetch] = useDataApi(
    "http://localhost:1337/products",
    {
      data: [],
    }
  );

  useEffect(()=>{
    setItems([...products])
  },[data])

  console.log(`Rendering Products ${JSON.stringify(data)}`);

  // Fetch Data
  const addToCart = (e) => {
    let name = e.target.name;
    let item = items.filter((item) => item.name == name);
    let instock = item[0].instock;
    if(instock > 0){
      instock --;
      setCart([...cart, ...item]);
    }else {
      return
    }   
    item[0].instock = instock;
    console.log(`add to Cart ${JSON.stringify(item)}`);
    doFetch(query);
  };

  const deleteCartItem = (index) => {
    cart[index].instock++
    let newCart = cart.filter((item, i) => index != i);   
    setCart(newCart);
  };
 
  console.log(data)
  let list = items.map((item, index) => {
    let random = Math.floor(Math.random()*100)
    let n = index + random;
    let url = "https://picsum.photos/id/" + n + "/50/50";
    console.log(url)
    return (
      <li key={index}>
        <Image src={url} width={70} roundedCircle></Image>
        <Button variant="primary" size="large">
          {item.name}<br/>{`Cost:$${item.cost}`}<br/>{`Instock:${item.instock}`}
        </Button>
        <input name={item.name} type="submit" onClick={addToCart}></input>
      </li>
    );
  });

  let cartList = cart.map((item, index) => {
    return (
      <Card key={index}>
        <Card.Header>
          <Accordion.Toggle as={Button} variant="link" eventKey={1 + index}>
            {item.name}
          </Accordion.Toggle>
        </Card.Header>
        <Accordion.Collapse
          onClick={() => deleteCartItem(index)}
          eventKey={1 + index}
        >
          <Card.Body>
            $ {item.cost} from {item.country}
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    );
  });

  let finalList = () => {
    let total = getTotalCart();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name}
        </div>
      );
    });
    return { final, total };
  };

  const getTotalCart = ()=>{
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    console.log(`total updated to ${newTotal}`);
    return newTotal;
  }
  const checkOut = () => {
    setCart([])
    alert(`Your total today was: $${total}`)
  };

  // TODO: implement the restockProducts function
  const restockProducts = async (url) => {
    let restock = await axios(url)
    restock = restock.data;
    restock.map(item=>{
      let name = item.name;
      let stock = item.instock;
      let current = items.filter((item) => item.name == name);
      current[0].instock += stock;
      setItems([...items])
    })
  };

  return (
    <Container>
      <Row>
        <Col>
          <h1>Product List</h1>
          <ul style={{ listStyleType: "none" }}>{list}</ul>
        </Col>
        <Col>
          <h1>Cart Contents</h1>
          <Accordion>{cartList}</Accordion>
        </Col>
        <Col>
          <h1>CheckOut </h1>
          <Button onClick={checkOut}>CheckOut $ {finalList().total}</Button>
          <div> {finalList().total > 0 && finalList().final} </div>
        </Col>
      </Row>
      <Row>
        <form
          onSubmit={(event) => {
            restockProducts(`${query}`);
            console.log(`Restock called on ${query}`);
            event.preventDefault();
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">ReStock Products</button>
        </form>
      </Row>
    </Container>
  );
};

export default Products;
