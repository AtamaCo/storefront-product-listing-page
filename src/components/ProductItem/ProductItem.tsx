/*
Copyright 2024 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/

import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';

import '../ProductItem/ProductItem.css';

import { useProducts, useSensor, useStore } from '../../context';
import NoImage from '../../icons/NoImage.svg';
import {
  Product,
  ProductAttribute,
  ProductLabel,
  ProductViewMedia,
  RedirectRouteFunc,
  RefinedProduct,
} from '../../types/interface';
import { SEARCH_UNIT_ID } from '../../utils/constants';
import {
  generateOptimizedImages,
  getProductImageURLs,
} from '../../utils/getProductImage';
import { htmlStringDecode } from '../../utils/htmlStringDecode';
import { AddToCartButton } from '../AddToCartButton';
import { ImageCarousel } from '../ImageCarousel';
import { SwatchButtonGroup } from '../SwatchButtonGroup';
import { UpdateQuantityWidget } from '../UpdateQuantityWidget';
import OutOfStockDisplay from './OutOfStockDisplay';
import ProductCapsules from './ProductCapsules';
import ProductPrice from './ProductPrice';

export interface ProductProps {
  item: Product;
  productLabels?: ProductLabel[];
  currencySymbol: string;
  currencyRate?: string;
  setRoute?: RedirectRouteFunc | undefined;
  refineProduct: (optionIds: string[], sku: string) => any;
  outOfStockBehavior: (productId: number) => void;
  setCartUpdated: (cartUpdated: boolean) => void;
  setItemAdded: (itemAdded: string) => void;
  setError: (error: boolean) => void;
  addToCart: (
    sku: string,
    options: [],
    quantity: number
  ) => Promise<void | undefined>;
}

export const ProductItem: FunctionComponent<ProductProps> = ({
  item,
  productLabels,
  currencySymbol,
  currencyRate,
  setRoute,
  refineProduct,
  outOfStockBehavior,
  setError,
  addToCart,
}: ProductProps) => {
  const { product, productView } = item;
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [recentlyAddedToCart, setRecentlyAddedToCart] = useState(false);
  const [selectedSwatch, setSelectedSwatch] = useState('');
  const [imagesFromRefinedProduct, setImagesFromRefinedProduct] = useState<
    ProductViewMedia[] | null
  >();
  const [refinedProduct, setRefinedProduct] = useState<RefinedProduct>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  const [isHovering, setIsHovering] = useState(false);
  const { viewType } = useProducts();
  const {
    config: { optimizeImages, imageBaseWidth, imageCarousel, listview },
  } = useStore();

  const { screenSize } = useSensor();

  const handleMouseOver = () => {
    setIsHovering(true);
  };

  const handleMouseOut = () => {
    setIsHovering(false);
  };

  const handleSelection = async (optionIds: string[], sku: string) => {
    const data = await refineProduct(optionIds, sku);
    setSelectedSwatch(optionIds[0]);
    setImagesFromRefinedProduct(data.refineProduct.images);
    setRefinedProduct(data);
    setCarouselIndex(0);
  };

  const isSelected = (id: string) => {
    const selected = selectedSwatch ? selectedSwatch === id : false;
    return selected;
  };

  const productImageArray = imagesFromRefinedProduct
    ? getProductImageURLs(imagesFromRefinedProduct ?? [], imageCarousel ? 3 : 1)
    : getProductImageURLs(
        productView.images ?? [],
        imageCarousel ? 3 : 1, // number of images to display in carousel
        product.image?.url ?? undefined
      );
  let optimizedImageArray: { src: string; srcset: any }[] = [];

  if (optimizeImages) {
    optimizedImageArray = generateOptimizedImages(
      productImageArray,
      imageBaseWidth ?? 200
    );
  }

  // will have to figure out discount logic for amount_off and percent_off still
  const discount: boolean = refinedProduct
    ? refinedProduct.refineProduct?.priceRange?.minimum?.regular?.amount
        ?.value >
      refinedProduct.refineProduct?.priceRange?.minimum?.final?.amount?.value
    : product?.price_range?.minimum_price?.regular_price?.value >
        product?.price_range?.minimum_price?.final_price?.value ||
      productView?.price?.regular?.amount?.value >
        productView?.price?.final?.amount?.value;
  const isComplexProductView = productView?.__typename === 'ComplexProductView';
  const isBundle = product?.__typename === 'BundleProduct';
  const isGrouped = product?.__typename === 'GroupedProduct';
  const isGiftCard = product?.__typename === 'GiftCardProduct';
  const isConfigurable = product?.__typename === 'ConfigurableProduct';

  const onProductClick = () => {
    window.magentoStorefrontEvents?.publish.searchProductClick(
      SEARCH_UNIT_ID,
      product?.sku
    );
  };

  const productUrl = setRoute
    ? setRoute({ sku: productView?.sku, urlKey: productView?.urlKey })
    : product?.canonical_url;

  const handleAddToCart = async () => {
    setError(false);
    setAddingToCart(true);
    //Custom add to cart function passed in
    await addToCart(productView.sku, [], quantity);
    setAddingToCart(false);
    setRecentlyAddedToCart(true);
    window.setTimeout(() => setRecentlyAddedToCart(false), 2000);
  };

  if (listview && viewType === 'listview') {
    return (
      <>
        <div className="grid-container">
          <div
            className={`product-image ds-sdk-product-item__image relative rounded-md overflow-hidden}`}
          >
            <a
              href={productUrl as string}
              onClick={onProductClick}
              className="!text-primary hover:no-underline hover:text-primary"
            >
              {/* Image */}
              {productImageArray.length ? (
                <ImageCarousel
                  images={
                    optimizedImageArray.length
                      ? optimizedImageArray
                      : productImageArray
                  }
                  productName={product.name}
                  carouselIndex={carouselIndex}
                  setCarouselIndex={setCarouselIndex}
                />
              ) : (
                <NoImage
                  className={`max-h-[250px] max-w-[200px] pr-5 m-auto object-cover object-center lg:w-full`}
                />
              )}
            </a>
          </div>
          <div className="product-details">
            <div className="flex flex-col w-1/3">
              {/* Product name */}
              <a
                href={productUrl as string}
                onClick={onProductClick}
                className="!text-primary hover:no-underline hover:text-primary"
              >
                <div className="ds-sdk-product-item__product-name mt-xs text-sm text-primary">
                  {product.name !== null && htmlStringDecode(product.name)}
                </div>
                <div className="ds-sdk-product-item__product-sku mt-xs text-sm text-primary">
                  SKU:
                  {product.sku !== null && htmlStringDecode(product.sku)}
                </div>
              </a>

              {/* Swatch */}
              <div className="ds-sdk-product-item__product-swatch flex flex-row mt-sm text-sm text-primary pb-6 ab-c">
                {productView?.options?.map(
                  (swatches) =>
                    swatches.id === 'color' && (
                      <SwatchButtonGroup
                        key={productView?.sku}
                        isSelected={isSelected}
                        swatches={swatches.values ?? []}
                        showMore={onProductClick}
                        productUrl={productUrl as string}
                        onClick={handleSelection}
                        sku={productView?.sku}
                      />
                    )
                )}
              </div>
            </div>
          </div>
          <div className="product-price">
            <a
              href={productUrl as string}
              onClick={onProductClick}
              className="!text-primary hover:no-underline hover:text-primary"
            >
              <ProductPrice
                item={refinedProduct ?? item}
                isBundle={isBundle}
                isGrouped={isGrouped}
                isGiftCard={isGiftCard}
                isConfigurable={isConfigurable}
                isComplexProductView={isComplexProductView}
                discount={discount}
                currencySymbol={currencySymbol}
                currencyRate={currencyRate}
              />
            </a>
          </div>
          <div className="product-description text-sm text-primary mt-xs">
            <a
              href={productUrl as string}
              onClick={onProductClick}
              className="!text-primary hover:no-underline hover:text-primary"
            >
              {product.short_description?.html ? (
                <>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: product.short_description.html,
                    }}
                  />
                </>
              ) : (
                <span />
              )}
            </a>
          </div>

          {/* TO BE ADDED LATER */}
          <div className="product-ratings" />
          <div className="product-add-to-cart">
            <div className="pb-4 h-[38px] w-96">
              <AddToCartButton onClick={handleAddToCart} />
            </div>
          </div>
        </div>
      </>
    );
  }

  const getProductViewAttributeValue = (attributeName: string | null) => {
    return productView?.attributes.find(
      (attribute: ProductAttribute) => attribute.name === attributeName
    )?.value;
  };
  // if (
  //   product.sku.includes('TOFFEE NUT LATTE') ||
  //   product.name.includes('SPECIAL.T')
  // ) {
  //   // eslint-disable-next-line no-console
  //   console.log(product);
  //   // eslint-disable-next-line no-console
  //   console.log(productView);
  // }
  
  return (
    <div
      className={`ds-sdk-product-item group relative flex flex-col max-w-sm justify-between h-full hover:border-[1.5px] border-solid hover:shadow-lg border-offset-2 p-2 ${productView.inStock ? 'in-stock' : 'out-of-stock'}`} 
      style={{
        'border-color': '#D5D5D5',
      }}
      onMouseEnter={handleMouseOver}
      onMouseLeave={handleMouseOut}
    >
      <div className="product-item-top">
        <a
          href={productUrl as string}
          onClick={onProductClick}
          className="!text-primary hover:no-underline hover:text-primary"
        >
          {(!productView.inStock || productLabels && productLabels.length > 0) &&
          <div class="product-card__badges">
            <div class="product-badge" style={productView.inStock ? productLabels?.[0].style : ""}>
              {!productView.inStock ?  <span>EN RUPTURE DE STOCK</span> : <span>{productLabels?.[0].txt}</span>}
            </div>
          </div>}
          {getProductViewAttributeValue('coffee_intensity') && (
            <div className="ds-sdk-product-item__intensity">
              <span className="intensity-text">Intensité</span>
              <span className="intensity-number">
                {getProductViewAttributeValue('coffee_intensity')}
              </span>
            </div>
          )}
          <div className="ds-sdk-product-item__main relative flex flex-col justify-between h-full">
            <div className="ds-sdk-product-item__image relative w-full h-full rounded-md overflow-hidden">
              {productImageArray.length ? (
                <ImageCarousel
                  images={
                    optimizedImageArray.length
                      ? optimizedImageArray
                      : productImageArray
                  }
                  productName={product.name}
                  carouselIndex={carouselIndex}
                  setCarouselIndex={setCarouselIndex}
                />
              ) : (
                <NoImage
                  className={`max-h-[45rem] w-full object-cover object-center lg:w-full`}
                />
              )}
            </div>
            <div className="ds-sdk-product-item__product-name mt-md text-sm text-primary">
              {product.name !== null && htmlStringDecode(product.name)}
            </div>
          </div>
        </a>
        <div className="subtitles">
          <ProductCapsules item={item} />
          <div className="flavor-characteristic">
            {getProductViewAttributeValue('flavor_characteristic')}
          </div>
        </div>
      </div>

      {productView?.options?.find(item => item.id === 'color') && (
        <div className="ds-sdk-product-item__product-swatch flex flex-row mt-sm text-sm text-primary ccc">
          {productView?.options?.map(
            (swatches) =>
              swatches.id == 'color' && (
                <SwatchButtonGroup
                  key={product?.sku}
                  isSelected={isSelected}
                  swatches={swatches.values ?? []}
                  showMore={onProductClick}
                  productUrl={productUrl as string}
                  onClick={handleSelection}
                  sku={product?.sku}
                />
              )
          )}
        </div>
      )}
      {productView.inStock ? (<><ProductPrice
        item={refinedProduct ?? item}
        isBundle={isBundle}
        isGrouped={isGrouped}
        isGiftCard={isGiftCard}
        isConfigurable={isConfigurable}
        isComplexProductView={isComplexProductView}
        discount={discount}
        currencySymbol={currencySymbol}
        currencyRate={currencyRate}
      />
      <div className="pb-4 mt-sm">
        <UpdateQuantityWidget quantity={quantity} setQuantity={setQuantity} />
        {screenSize.mobile && (
          <AddToCartButton
            onClick={handleAddToCart}
            addingToCart={addingToCart}
            recentlyAddedToCart={recentlyAddedToCart}
          />
        )}
        {screenSize.desktop && (
          <AddToCartButton
            onClick={handleAddToCart}
            addingToCart={addingToCart}
            recentlyAddedToCart={recentlyAddedToCart}
          />
        )}
      </div></>) : (<OutOfStockDisplay item={refinedProduct ?? item} outOfStockBehavior={outOfStockBehavior} />)}
    </div>
  );
};

export default ProductItem;
