/*
Copyright 2024 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/

import { v4 as uuidv4 } from 'uuid';

import { updateSearchInputCtx, updateSearchResultsCtx } from '../context';
import {
  AttributeMetadataResponse,
  ClientProps,
  MagentoHeaders,
  ProductSearchQuery,
  ProductSearchResponse,
  PromoTileResponse,
  RefinedProduct,
  RefineProductQuery,
} from '../types/interface';
import { SEARCH_UNIT_ID } from '../utils/constants';
import {
  ATTRIBUTE_METADATA_QUERY,
  PRODUCT_SEARCH_QUERY,
  REFINE_PRODUCT_QUERY,
} from './queries';

const getHeaders = (headers: MagentoHeaders) => {
  return {
    'Magento-Environment-Id': headers.environmentId,
    'Magento-Website-Code': headers.websiteCode,
    'Magento-Store-Code': headers.storeCode,
    'Magento-Store-View-Code': headers.storeViewCode,
    'X-Api-Key': headers.apiKey,
    'X-Request-Id': headers.xRequestId,
    'Content-Type': 'application/json',
    'Magento-Customer-Group': headers.customerGroup,
  };
};

const getProductSearch = async ({
  environmentId,
  websiteCode,
  storeCode,
  storeViewCode,
  apiKey,
  apiUrl,
  phrase,
  pageSize = 24,
  displayOutOfStock,
  currentPage = 1,
  xRequestId = uuidv4(),
  filter = [],
  sort = [],
  context,
  categorySearch = false,
}: ProductSearchQuery & ClientProps): Promise<
  ProductSearchResponse['data']
> => {
  const variables = {
    phrase,
    pageSize,
    currentPage,
    filter,
    sort,
    context,
  };

  // default filters if search is "catalog (category)" or "search"
  let searchType = 'Search';
  if (categorySearch) {
    searchType = 'Catalog';
  }
  const defaultFilters = {
    attribute: 'visibility',
    in: [searchType, 'Catalog, Search'],
  };

  variables.filter.push(defaultFilters); //add default visibility filter

  const displayInStockOnly = displayOutOfStock != '1'; // '!=' is intentional for conversion

  const inStockFilter = {
    attribute: 'inStock',
    eq: 'true',
  };

  if (displayInStockOnly) {
    variables.filter.push(inStockFilter);
  }

  const headers = getHeaders({
    environmentId,
    websiteCode,
    storeCode,
    storeViewCode,
    apiKey,
    xRequestId,
    customerGroup: context?.customerGroup ?? '',
  });

  // ======  initialize data collection =====
  const searchRequestId = uuidv4();

  updateSearchInputCtx(
    SEARCH_UNIT_ID,
    searchRequestId,
    phrase,
    filter,
    pageSize,
    currentPage,
    sort
  );

  const magentoStorefrontEvtPublish = window.magentoStorefrontEvents?.publish;

  magentoStorefrontEvtPublish?.searchRequestSent &&
    magentoStorefrontEvtPublish.searchRequestSent(SEARCH_UNIT_ID);
  // ======  end of data collection =====

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: PRODUCT_SEARCH_QUERY,
      variables: { ...variables },
    }),
  });

  const results = await response.json();
  // ======  initialize data collection =====
  updateSearchResultsCtx(
    SEARCH_UNIT_ID,
    searchRequestId,
    results?.data?.productSearch
  );

  magentoStorefrontEvtPublish?.searchResponseReceived &&
    magentoStorefrontEvtPublish.searchResponseReceived(SEARCH_UNIT_ID);

  if (categorySearch) {
    magentoStorefrontEvtPublish?.categoryResultsView &&
      magentoStorefrontEvtPublish.categoryResultsView(SEARCH_UNIT_ID);
  } else {
    magentoStorefrontEvtPublish?.searchResultsView &&
      magentoStorefrontEvtPublish.searchResultsView(SEARCH_UNIT_ID);
  }
  // ======  end of data collection =====

  return results?.data;
};

const getAttributeMetadata = async ({
  environmentId,
  websiteCode,
  storeCode,
  storeViewCode,
  apiKey,
  apiUrl,
  xRequestId = uuidv4(),
}: ClientProps): Promise<AttributeMetadataResponse['data']> => {
  const headers = getHeaders({
    environmentId,
    websiteCode,
    storeCode,
    storeViewCode,
    apiKey,
    xRequestId,
    customerGroup: '',
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: ATTRIBUTE_METADATA_QUERY,
    }),
  });
  const results = await response.json();
  return results?.data;
};

const getCategoryPromoTiles = async ({
  promoTilesDataPath,
  categoryPath,
}: {
  promoTilesDataPath: string;
  categoryPath: string;
}): Promise<PromoTileResponse[]> => {
  try {
    const promoTilesJSON = await fetch(promoTilesDataPath).then((res) =>
      res.text()
    );
    const tiles: { data: PromoTileResponse[] } = JSON.parse(promoTilesJSON);
    return tiles?.data.filter((item) => {
      return (
        item.path &&
        item.destination &&
        item.image &&
        item.position &&
        categoryPath
          .replace(/^\/|\/$/g, '')
          .toUpperCase()
          .startsWith(item?.path?.replace(/^\/|\/$/g, '').toUpperCase())
      );
    });
  } catch (error) {
    return [];
  }
};

const refineProductSearch = async ({
  environmentId,
  websiteCode,
  storeCode,
  storeViewCode,
  apiKey,
  apiUrl,
  xRequestId = uuidv4(),
  context,
  optionIds,
  sku,
}: RefineProductQuery & ClientProps): Promise<RefinedProduct> => {
  const variables = {
    optionIds,
    sku,
  };

  const headers = getHeaders({
    environmentId,
    websiteCode,
    storeCode,
    storeViewCode,
    apiKey,
    xRequestId,
    customerGroup: context?.customerGroup ?? '',
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: REFINE_PRODUCT_QUERY,
      variables: { ...variables },
    }),
  });
  const results = await response.json();
  return results?.data;
};

export {
  getAttributeMetadata,
  getProductSearch,
  refineProductSearch,
  getCategoryPromoTiles,
};
