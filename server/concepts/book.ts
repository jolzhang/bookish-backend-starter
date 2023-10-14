import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";


export interface BookDoc extends BaseDoc {
    title: string;
    author: string;
    summary: string;
    groups: Array<ObjectId>;
    review: Number;
}

export default class BookConcept {
    public readonly books = new DocCollection<BookDoc>("books");

    async newBook(title: string, author: string, summary: string, review: Number) {
        const groups = Array<ObjectId>();
        const _id = await this.books.createOne( {title, author, summary, groups, review} );
        return { msg: "New Book created!", book: await this.books.readOne({ _id })};
    }

    async getBookfromTitle(name: string) {
        const book = await this.books.readOne({ title: name });
        if (book) {
            return book;
        }
        throw new NotFoundError("Book Not Found from Name");
    }

    // Helper function that checks if a group is already registered for book
    private async groupInBook(title: string, group: ObjectId) {
        await this.getBookfromTitle(title);
        const book = await this.getBookfromTitle(title);
        for (let i = 0; i < book.groups.length; i ++) {
            if (book.groups[i].equals(group)) {
                return true;
            }
        }
        return false;
    }
    
    async addGroup(title: string, group: ObjectId) {
        await this.getBookfromTitle(title);
        const book = await this.getBookfromTitle(title);
        if (!(await this.groupInBook(title, group))) { 
            book.groups.push(group);
            await this.books.updateOne({ _id: book._id}, { ...book, groups: book.groups });
            return { msg: "Successfully added group to book", id: book};
        }
        throw new CouldNotAddGroup;
    }

    async removeGroup(title: string, group: ObjectId) {
        await this.getBookfromTitle(title);
        const book = await this.getBookfromTitle(title);
        if (await this.groupInBook(title, group)) {
            book.groups.filter((g) => !(g.equals(group)));
            await this.books.updateOne({ _id: book._id}, { ...book, groups: book.groups});
            return { msg: "Successfully removed group from book", id: book };
        }
        throw CouldNotRemoveGroup;
    }

    async getAllBooks() {
        return await this.books.readMany({});
    }

    async bookRecommend() {
        const lst = new Set<string>();
        const allBooks = await this.getAllBooks();
        while (lst.size < 10) {
            let rand = Math.random() * ((allBooks.length - 1) - 0) + 0;
            lst.add(allBooks[rand].title);
        }
        return lst;
    }
}

export class CouldNotAddGroup extends NotAllowedError {
    constructor() {
        super("Could not successfully add group to book");
    }
}

export class CouldNotRemoveGroup extends NotAllowedError {
    constructor() {
        super("Could not successfully remove group from book");
    }
}