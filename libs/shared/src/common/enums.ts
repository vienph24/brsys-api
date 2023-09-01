export enum Status {
    Processing = 'processing',
    Error = 'error',
    Success = 'success',
    Parsed = 'parsed',
}

export enum Document {
    Csv = 'csv',
    Excel = 'excel',
}

export enum Pattern {
    RecordTransaction = 'RecordTransaction',
}

export enum Event {
    UpdateRecordStatus = 'UpdateRecordStatusEvent',
}
