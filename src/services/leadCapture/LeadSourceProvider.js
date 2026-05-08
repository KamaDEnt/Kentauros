export class LeadSourceProvider {
  constructor(name) {
    this.name = name;
  }

  async search(query, options = {}) {
    throw new Error('Method search() must be implemented');
  }

  async extractDetails(leadUrl) {
    throw new Error('Method extractDetails() must be implemented');
  }
}
