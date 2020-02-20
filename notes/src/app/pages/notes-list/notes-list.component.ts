import { Component, OnInit, Optional, ViewChild, ElementRef } from '@angular/core';
import { Note } from 'src/app/shared/note.model';
import { NotesService } from 'src/app/shared/notes.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
  animations: [
    trigger('itemAnim', [
      // Entry Animation
      transition('void => *', [
        // Set initial state
        style({
          height: 0,
          opacity: 0,
          transform: 'scale(0.85)',
          'margin-bottom': 0,
          // bug in firefox means we have to use padding here
          paddingTop: 0,
          paddingBottom: 0,
          paddingRight: 0,
          paddingLeft: 0
        }),
        // we first want to animate the spacing ( which includes height and margin)
        animate('50ms', style({
          height: '*',
          'margin-bottom': '*',
          paddingTop: '*',
          paddingBottom: '*',
          paddingRight: '*',
          paddingLeft: '*'
        })),
        animate(68)
      ]),
      transition('* => void', [
          // first scale up
          animate(50, style({
            transform: 'scale(1.05)'
          })),
          // then scale down while beginning to fade out
          animate(50, style({
            transform: 'scale(1)',
            opacity: 0.75
          })),
          // scale down and fade out completely
          animate('120ms ease-out', style({
            opacity: 0,
            transform: 'scale(0.68)'
          })),
          // then animate the spacing which includes space and margin
          animate('150ms ease-out', style({
            paddingTop: 0,
            paddingBottom: 0,
            paddingRight: 0,
            paddingLeft: 0,
            height: 0,
            'margin-bottom': '0'
          }))
      ])
    ]),
      trigger('listAnim', [
        transition('* => *', [
          query(':enter', [
            style({
              opacity: 0,
              height: 0,
            }),
            stagger(100, [
              animate('0.2s ease')
            ])
          ], {
            optional: true
          })
        ])
      ])
  ]
})
export class NotesListComponent implements OnInit {
  notes: Note[] = new Array<Note>();
  filteredNotes: Note[] = new Array<Note>();

  @ViewChild('filterInput', {static: true}) filterInputElRef: ElementRef<HTMLInputElement>;

  constructor(private notesService: NotesService) { }

  ngOnInit() {
    // we want to retrieve all notes from NotesService
    this.notes = this.notesService.getAll();
    // this.filteredNotes = this.notesService.getAll();
    this.filter('');
  }

  deleteNote(note: Note){
    let noteId = this.notesService.getId(note);
    this.notesService.delete(noteId);

    this.filter(this.filterInputElRef.nativeElement.value);
  }

  filter(query: string) {
    query = query.toLowerCase().trim();
    let allResults: Note[] = new Array<Note>();
    // split up the search query into individual words
    let terms: string[] = query.split(' ');
    // remove dups
    terms = this.removeDuplicates(terms);
    // compile all relevant results into the allResults array
    terms.forEach(term => {
      let results: Note[] = this.relevantNotes(term);
      // append results to the allResults array
      allResults = [...allResults, ...results]
    });

    // allResults will include dups
    // because a particular note can be the result of many search terms
    // but we don't want to show the same note multiple times on the UI
    // so we first must remove the duplicates
    console.log(allResults)
    let uniqueResults = this.removeDuplicates(allResults);
    this.filteredNotes = uniqueResults;

    // now sort by relevancy ///////////////////////////////////////////////////////
    this.sortByRelevancy(allResults);
  }

  removeDuplicates(arr: Array<any>) : Array<any> {
    let uniqueResults: Set<any> = new Set<any>();

    arr.forEach(e => uniqueResults.add(e));
    
    return Array.from(uniqueResults);
  }

  relevantNotes(query: any) : Array<Note> {
    query = query.toLowerCase().trim();
    let relevantNotes = this.notes.filter(note => {
      if (note.title && note.title.toLowerCase().includes(query)){
        return true;
      }
      if (note.body && note.body.toLowerCase().includes(query)){
        return true;
      }
       return false;
    })
    return relevantNotes;
  }

  // sort search results
  sortByRelevancy(searchResults: Note[]) {
    // will calculate the relevancy of a note based on the number of times it appears in the search results
    let noteCountObj: Object = {} // format - key:value => NoteId:number (note object id : count)
    
    searchResults.forEach(note => {
      let noteId = this.notesService.getId(note);

      if (noteCountObj[noteId]) {
        noteCountObj[noteId] += 1;
      } else {
        noteCountObj[noteId] = 1;
      }
    })
    
    this.filteredNotes = this.filteredNotes.sort((a: Note, b: Note) => {
      let aId = this.notesService.getId(a);
      let bId = this.notesService.getId(b);

      let aCount = noteCountObj[aId];
      let bCount = noteCountObj[bId];

      return bCount - aCount;
    })
    
  }

  generateNoteURL(note: Note) {
    let noteId = this.notesService.getId(note);
    return noteId
  }

}