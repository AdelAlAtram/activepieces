import { createAction, Property } from '@activepieces/pieces-framework';
import { chargekeepAuth } from "../..";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";


export const addOrUpdateSubscription = createAction({
  name: 'addOrUpdateSubscription',
  displayName: 'Add or Update Subscription',
  description: 'Creates a new subscription.',
  auth: chargekeepAuth,
  props: {
    contactId: Property.Number({
      displayName: 'Contact ID',
      defaultValue: 0,
      required: true,
    }),
    productId: Property.Number({
      displayName: 'Product ID',
      required: false,
    }),
    contactXref: Property.ShortText({
      displayName: 'External Contact ID',
      description: "ContactXref have to be specified and correct to look up the correct contact",
      required: false,
    }),
    productCode: Property.ShortText({
      displayName: 'Product Code',
      description: 'Product Code (Unique product identifier). ProductCode have to be specified and correct to look up the correct product',
      required: true,
    }),
    paymentPeriodType: Property.Dropdown({
      displayName: 'Payment Period Type',
      description: 'The chosen Period Type has to be set for the Product on Sperse side',
      required: true,
      defaultValue: 'Monthly',
      refreshers: [],
      options: async () => {
        return {
          options: [
            {
              label: 'Monthly',
              value: 'Monthly',
            },
            {
              label: 'Annual',
              value: 'Annual',
            },
            {
              label: 'LifeTime',
              value: 'LifeTime',
            },
          ],
        };
      },
    }),
    hasRecurringBilling: Property.Dropdown({
      displayName: 'Is it Recurring Billing',
      required: false,
      defaultValue: false,
      refreshers: [],
      options: async () => {
        return {
          options: [
            {
              label: "Yes",
              value: true,
            },
            {
              label: "No",
              value: false,
            },
          ],
        };
      },
    }),
  },
  async run(context) {
    const subscription = {
      contactId: context.propsValue.contactId,
      contactXref: context.propsValue.contactXref,
      products: [
        {
          productId: context.propsValue.productId,
          productCode: context.propsValue.productCode,
          paymentPeriodType: context.propsValue.paymentPeriodType,
          hasRecurringBilling: context.propsValue.hasRecurringBilling,
        }
      ],
      productId: context.propsValue.productId,
      productCode: context.propsValue.productCode,
      paymentPeriodType: context.propsValue.paymentPeriodType,
      hasRecurringBilling: context.propsValue.hasRecurringBilling,
    };

    const res = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: "https://beta.chargekeep.com/api/services/CRM/OrderSubscription/Update",
      headers: {
        'api-key': context.auth, // Pass API key in headers
        'Content-Type': 'application/json'
      },
      body: {
        ...subscription
      },
    });

    return {
      status: res.status,
      body: res.body,
    };
  },
});
