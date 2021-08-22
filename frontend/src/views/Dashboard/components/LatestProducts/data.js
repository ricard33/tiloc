import {v1 as uuid} from 'uuid';
import moment from 'moment';
import Product1Image from 'assets/images/products/product_1.png'
import Product2Image from 'assets/images/products/product_2.png'
import Product3Image from 'assets/images/products/product_3.png'
import Product4Image from 'assets/images/products/product_4.png'
import Product5Image from 'assets/images/products/product_5.png'

const products = [
  {
    id: uuid(),
    name: 'Dropbox',
    imageUrl: Product1Image,
    updatedAt: moment().subtract(2, 'hours')
  },
  {
    id: uuid(),
    name: 'Medium Corporation',
    imageUrl: Product2Image,
    updatedAt: moment().subtract(2, 'hours')
  },
  {
    id: uuid(),
    name: 'Slack',
    imageUrl: Product3Image,
    updatedAt: moment().subtract(3, 'hours')
  },
  {
    id: uuid(),
    name: 'Lyft',
    imageUrl: Product4Image,
    updatedAt: moment().subtract(5, 'hours')
  },
  {
    id: uuid(),
    name: 'GitHub',
    imageUrl: Product5Image,
    updatedAt: moment().subtract(9, 'hours')
  }
];
export default products;
