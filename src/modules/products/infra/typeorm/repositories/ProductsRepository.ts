import { getRepository, Repository } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const findProduct = await this.ormRepository.findByIds(products);

    return findProduct;
  }

  public async updateQuantity(
    productsDTO: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const ids = productsDTO.map(product => product.id);

    let products = await this.ormRepository.findByIds(ids);

    products = products.map(product => {
      const productDTO = productsDTO.find(p => p.id === product.id);

      if (!productDTO) throw new AppError('Product not found.');

      return { ...product, quantity: product.quantity - productDTO.quantity };
    });

    products = await this.ormRepository.save(products);

    return products;
  }
}

export default ProductsRepository;
