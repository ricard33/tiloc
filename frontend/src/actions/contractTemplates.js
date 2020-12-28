import * as types from "./actionTypes";

export function fetchContractTemplates() {
  return {
    type: types.REQUEST(types.FETCH_CONTRACT_TEMPLATES),
  };
}

export function getContractTemplate(templateId, callback) {
  return {
    type: types.REQUEST(types.GET_CONTRACT_TEMPLATE),
    id: templateId,
    callback
  };
}

export function createContractTemplate(template, callback) {
  return {
    type: types.REQUEST(types.CREATE_CONTRACT_TEMPLATE),
    data: {
      ...template,
    },
    callback
  };
}
export function updateContractTemplate(template, callback) {
  return {
    type: types.REQUEST(types.UPDATE_CONTRACT_TEMPLATE),
    id: template.id,
    data: {
      ...template,
    },
    callback
  };
}

export function deleteContractTemplate(template_id, callback) {
  return {
    type: types.REQUEST(types.DELETE_CONTRACT_TEMPLATE),
    id: template_id,
    callback
  };
}
