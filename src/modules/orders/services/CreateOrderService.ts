import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
// import { O_RDONLY } from 'constants';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) throw new AppError('Customer does not exists.');

    const findProducts = await this.productsRepository.findAllById(products);

    if (findProducts.length !== products.length)
      throw new AppError('Products has some invalid id.');

    const productsInfo = findProducts.map(findProduct => {
      const refProduct = products.find(
        product => product.id === findProduct.id,
      );

      if (!refProduct) throw new AppError('teste');

      if (refProduct.quantity > findProduct.quantity)
        throw new AppError('Some products have insufficient quantities.');

      return {
        product_id: findProduct.id,
        quantity: refProduct.quantity,
        price: findProduct.price,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productsInfo,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
